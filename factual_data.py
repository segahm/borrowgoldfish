#!/usr/bin/python -tt

from factual import Factual
from yelp import YSearch
from gplaces import GSearch
import csv
import copy
import json

#Google Places
#GOOGLE_AUTH_KEY = 'AIzaSyAD2PFsRBWs9LRZCeKE5yoJO3PITVlqmK8'   #production
#GOOGLE_AUTH_KEY = 'AIzaSyCx7idVBv7n4xtKjkKCHSdxnkL3LTFzqkU'    #development

google = GSearch(
    'AIzaSyCx7idVBv7n4xtKjkKCHSdxnkL3LTFzqkU',  #GOOGLE_AUTH_KEY
    10000,  #GOOGLE_LIMIT_ENTRIES      
    10000,   #GOOGLE_CITY_RADIUS  # Define the radius (in meters) for city search
    3)      #GOOGLE_ATTEMPT_LIMIT       

#must not exceed 10,000 (daily limitation)
LIMIT_ENTRIES = 10000
LIMIT_REQUEST_ENTRIES = 500
# burst limit for Factual requests
LIMIT_BURST_MINUTE = 500    # not implemented currently

REGIONS_INPUT = 'regions.txt'
OUT_DATA_FILE = 'out.csv'
OUT_COUNTY_FILE = 'counties.csv'

DEBUG_WRITE_AGGREGATE_SUMMARY_ONLY = False
KEY = 'K23H6A5NTelYGN496SMLbikTcwyp71hoboh3rLv3'
SECRET = 'CNomvaXPlvgCDrIpb3FqPhIhZGwWIusGiCpn6Dzp'

factual = Factual(KEY, SECRET)

yelp = YSearch(
    "HnrWS3JCE4g4wbaCrVC0wg",    #consumer_key
    "XQfhrgq1yJoYnJjxFIOlDut-C44",          #consumer_secret
    "6pCeJihtCBUdcLZu9uSm1eRij20a-sYH",     #token
    "FcNRGSLGxAWa-O8JWv4MPFPn0hs")          #token_secret

write_keys = ['name',
    'postcode',
    'rating',
    'category_labels',
    'category_ids',
#   'cuisine',
    'price',
#    'reservations',
    'founded',
    'meal_breakfast',
    'meal_lunch',
    'meal_dinner',
    'meal_deliver',
    'meal_takeout',
    'meal_cater',
    'alcohol',
    'hours',
    'address',
    'locality',
    'neighborhood',
    'region',
    'tel',
    'chain_name',
    'email',
    'website',
    'owner',
    'factual_id']

county_totals = {}

# return a twitter id or False if no associated twitter id found
def findTwitter(factual_business_id):
    result = False
    try:
        cquery = factual.table('crosswalk')
        q2 = cquery.filters({'factual_id': factual_business_id,'namespace': 'twitter'}).select('factual_id,namespace_id')
        data = q2.data()
        if data:
            result = data[0]['namespace_id']
    except Exception as e:
        print "findTwitter error: %s" % (e)
    return result

#loads zip codes for target counties
def loadZipcodes():
    zip_codes = {}
    with open(REGIONS_INPUT) as csvfile:
        reader = csv.reader(csvfile, delimiter='\t', quotechar='"')
        for row in reader:
            if "\n" not in row:
                zip = row[0]
                county = row[1]
                zip_codes[zip] = county
                #for col in range(0,len(row)-1,2):
    return zip_codes

def parseYelpEntry(values,keys):
    entries = []
    for key in keys:
        if key == 'category_ids':
            v = values.get(key,[''])[0]
        elif key == 'category_labels':
            v = ','.join(values.get(key,[['']])[0])
        elif key == 'hours' and values.get('hours',False):
            hours_days = json.loads(values['hours'])
            v = len(hours_days.keys()) #number of days open per week
        else:
            v = values.get(key,'')
        entries.append(v)
    return entries

def main():
    #load zip codes for target areas
    zip_codes = loadZipcodes()

    #main table to query
    query = factual.table('restaurants-us')

    with open(OUT_DATA_FILE, 'wb') as f:
        writer = csv.writer(f,write_keys)
        header = copy.copy(write_keys)
        header += ['county','Yelp review','Yelp # of reviews','Yelp categories','Yelp # of matches','Yelp is closed','Google Name','Google Website']#,'Twitter']
        writer.writerow(header)
        daily_total = 0
        for zip_code in zip_codes.keys():
            total = 0
            offset = -1
            while offset < total and offset < LIMIT_REQUEST_ENTRIES and daily_total < LIMIT_ENTRIES:
                if offset == -1:
                    offset = 0  #first entry
                #pull page data
                # categories to exclude (edge cases):
                # ["social","bars","wine bars"]   1,037 entries
                # ["social","food and dining","breweries"]    830 entries
                # ["social","bars","hotel lounges"]   335 entries
                # ["social","food and dining","restaurants","vegan and vegetarian"]   324 entries
                # ["social","food and dining","restaurants","buffets"]    45 entries
                # ["social","food and dining","internet cafes"]   3 entries
                q1 = query.filters({'chain_name':{"$blank":True},'category_ids': {'$excludes_any': [316,341,313,368,350,345]},'postcode': {'$includes':zip_code}}).select(','.join(write_keys)).include_count(True).offset(offset).limit(1 if DEBUG_WRITE_AGGREGATE_SUMMARY_ONLY else 50)  #grab maximum allowed per page
                
                if total == 0:
                    total = q1.total_row_count()
                    print "Total business entries (open & closed) for %s: %d" % (zip_code,total)
                    #aggregate entries accross counties
                    if county_totals.get(zip_codes[zip_code],False) == False:
                        county_totals[zip_codes[zip_code]] = 0
                offset += 50

                if not DEBUG_WRITE_AGGREGATE_SUMMARY_ONLY:
                    #prepare options for Yelp Search
                    options = {'limit': 20, 'sort': 1}
                    try:
                        data = q1.data()
                        #loop through all businesses on the page
                        for b in data:
                            #set defaults for Google request
                            g_is_closed = False
                            gwebsite = ''
                            gname = ''
                            address = {'street': b.get('address',''),   #only street address is optional
                                        'city': b['locality'],
                                        'zipcode': zip_codes[b['postcode']],
                                        'state': b['region']
                                        }
                            try:
                                company = google.request(address,b['name'])
                                if company:
                                    if company['website'] == '-1':
                                        g_is_closed = True
                                    elif company['website'] != '1':
                                        gname = company['found_name']
                                        gwebsite = company['website']
                                    else:
                                        gname = company['found_name']   #found the business, but not a web site
                            except Exception as ge:
                                print "error: %s" % (ge)
                            #skip this business if Google says it is closed
                            if g_is_closed != True:
                                row = parseYelpEntry(b,write_keys)
                                options['term'] = b['name']
                                row.append(zip_codes[b['postcode']])
                                try:
                                    options['location'] = ', '.join([b.get('address',''),b.get('locality',''),zip_codes[b['postcode']]])
                                    #options to additional narrowing down
                                    options.update({
                                                'tel': b.get('tel',False),
                                                'address': b.get('address',False),
                                                'name': b['name']
                                    })
                                    response = yelp.request('/v2/search', options)
                                    #print json.dumps(response, sort_keys=True, indent=2)
                                    if response['total'] > 0:
                                        rating = 0
                                        number_reviews = 0
                                        categories = {}
                                        for num in range(0,response['total']):
                                            #merge Yelp rankings with weights for multiple matches
                                            rating += response['businesses'][num]['rating']*response['businesses'][num]['review_count']
                                            number_reviews += response['businesses'][num]['review_count']
                                            #merge Yelp categories accross multiple business matches
                                            for cat in response['businesses'][num].get('categories',[]):
                                                cat_identifier = cat[1]
                                                categories[cat_identifier] = 1 
                                        rating = rating/number_reviews

                                        
                                        row += [
                                            rating,
                                            number_reviews,
                                            ','.join(categories.keys()),
                                            response['total'],
                                            response['businesses'][0]['is_closed'],
                                            gname,
                                            gwebsite
                                        ]
                                        # twitter_id = findTwitter(b['factual_id'])
                                        # if twitter_id:
                                        #     row.append(twitter_id)
                                    else:
                                        row += ['','','',-1,'',gname,gwebsite]
                                    
                                except Exception as inst:
                                    print "error: %s" % (inst)
                                    row += ['','','',response['total']]
                                writer.writerow(row)
                                #keep accounting - only add the ones we process
                                county_totals[zip_codes[b['postcode']]] += 1
                    except Exception as e:
                        print "businesses loop error: %s" % (e)
            if offset == -1:
                print 'daily_total is %d, reached LIMIT_ENTRIES: %d' % (daily_total,LIMIT_ENTRIES)
            daily_total += total
            print "Total business entries scanned: %d" % (daily_total)

    with open(OUT_COUNTY_FILE, 'wb') as f:
        writer = csv.writer(f,write_keys)
        writer.writerow(['county','total restaurants'])
        for county in county_totals.keys():
            writer.writerow([county,county_totals[county]])
  
if __name__ == '__main__':
  main()