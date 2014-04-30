#!/usr/bin/python -tt

from factual import Factual
from yelp import YSearch
import csv
import copy
import json

LIMIT_ENTRIES = 100
REGIONS_INPUT = 'regions.txt'
OUT_DATA_FILE = 'out2.csv'

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
    'cuisine',
    'price',
    'reservations',
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
        print data
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

def main():
    #load zip codes for target areas
    zip_codes = loadZipcodes()

    #main table to query
    query = factual.table('restaurants-us')

    with open(OUT_DATA_FILE, 'wb') as f:
        writer = csv.writer(f,write_keys)
        header = copy.copy(write_keys)
        header += ['county','Yelp review','Yelp # of reviews','Yelp categories','Yelp # of matches','Yelp is closed','Twitter']
        writer.writerow(header)
        total = 0
        offset = -1
        while offset < total and offset < LIMIT_ENTRIES:
            if offset == -1:
                offset = 0  #first entry
            #pull page data
            q1 = query.filters({'postcode': {'$includes_any':zip_codes.keys()}}).select(','.join(write_keys)).include_count(True).offset(offset).limit(50)  #grab maximum allowed per page
            
            if total == 0:
                total = q1.total_row_count()
                print "Total business entries for the region: %d" % (total)
            data = q1.data()
            offset += 50
            #prepare options for Yelp Search
            options = {'limit': 20, 'sort': 1}
            #loop through all businesses on the page
            for b in data:
                row = []
                for key in write_keys:
                    row.append(b.get(key,''))
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
                    request = yelp.request('/v2/search', options)
                    response = request['response']
                    url = request['url']
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
                            response['businesses'][0]['is_closed']
                            ]
                        twitter_id = findTwitter(b['factual_id'])
                        if twitter_id:
                            row.append(twitter_id)
                    else:
                        row += ['','','',-1,'']
                    
                except Exception as inst:
                    print "main error: %s" % (inst)
                    row += ['','','',response['total']]
                writer.writerow(row)
  
if __name__ == '__main__':
  main()

  #[{u'status': u'1', u'category_labels': [[u'Social', u'Food and Dining', u'Restaurants', u'Mexican']], u'website': u'http://www.delias.com', u'alcohol': True, u'locality': u'Edinburg', u'price': 1, u'founded': u'1997', u'region': u'TX', u'name': u"Delia's"}, {u'status': u'1', u'category_labels': [[u'Social', u'Food andDining', u'Restaurants', u'Fast Food']], u'region': u'TX', u'name': u"R B's Fast Food", u'locality': u'Roma'}, {u'status': u'1', u'category_labels': [[u'Social', u'Food and Dining', u'Restaurants', u'Mexican']], u'region': u'TX', u'name': u'Exquisita Tortillas', u'locality': u'Edinburg'}]
  #'category_ids':{'$includes_any':[150,314,338,339,340,342,343,344,346,353,354,355,458]},