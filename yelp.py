"""Search interface to Yelp search API"""

import json
import oauth2
import urllib
import urllib2
import sys

import re

# parser = optparse.OptionParser()
# parser.add_option('-c', '--consumer_key', dest='consumer_key', help='OAuth consumer key (REQUIRED)')
# parser.add_option('-s', '--consumer_secret', dest='consumer_secret', help='OAuth consumer secret (REQUIRED)')
# parser.add_option('-t', '--token', dest='token', help='OAuth token (REQUIRED)')
# parser.add_option('-e', '--token_secret', dest='token_secret', help='OAuth token secret (REQUIRED)')
# parser.add_option('-a', '--host', dest='host', help='Host', default='api.yelp.com')

# parser.add_option('-q', '--term', dest='term', help='Search term')
# parser.add_option('-l', '--location', dest='location', help='Location (address)')
# parser.add_option('-b', '--bounds', dest='bounds', help='Bounds (sw_latitude,sw_longitude|ne_latitude,ne_longitude)')
# parser.add_option('-p', '--point', dest='point', help='Latitude,longitude')
# # Not sure if current location hints are currently working
# parser.add_option('-i', '--current_location', dest='current_location', help='Current location latitude,longitude for location disambiguation')

# parser.add_option('-o', '--offset', dest='offset', help='Offset (starting position)')
# parser.add_option('-r', '--limit', dest='limit', help='Limit (number of results to return)')
# parser.add_option('-u', '--cc', dest='cc', help='Country code')
# parser.add_option('-n', '--lang', dest='lang', help='Language code')

# parser.add_option('-d', '--radius', dest='radius', help='Radius filter (in meters)')
# parser.add_option('-g', '--category', dest='category', help='Category filter')
# parser.add_option('-z', '--deals', dest='deals', help='Deals filter')
# parser.add_option('-m', '--sort', dest='sort', help='Sort')



class YSearch:
  def __init__(self, consumer_key, consumer_secret, token, token_secret):
    # Required options
    self.consumer_key = consumer_key
    self.consumer_secret = consumer_secret
    self.token = token
    self.token_secret = token_secret
    self.non_decimal = re.compile(r'[^\d]+')


  def request(self, path, options):
    if not options.get('location',False) and not options.get('bounds',False) and not options.get('point',False):
      print '--location, --bounds, or --point required'
      sys.exit()
    # Setup URL params from options
    url_params = {}
    if options.get('term',False):
      url_params['term'] = options['term']
    if options.get('location',False):
      url_params['location'] = options['location']
    if options.get('bounds',False):
      url_params['bounds'] = options['bounds']
    if options.get('point',False):
      url_params['ll'] = options['point']
    if options.get('offset',False):
      url_params['offset'] = options['offset']
    if options.get('limit',False):
      url_params['limit'] = options['limit']
    if options.get('cc',False):
      url_params['cc'] = options['cc']
    if options.get('lang',False):
      url_params['lang'] = options['lang']
    if options.get('current_location',False):
      url_params['cll'] = options['current_location']
    if options.get('radius',False):
      url_params['radius_filter'] = options['radius']
    if options.get('category',False):
      url_params['category_filter'] = options['category']
    if options.get('deals',False):
      url_params['deals_filter'] = options['deals']
    if options.get('sort',False):
      url_params['sort'] = options['sort']
    """Returns response for API request."""

    consumer = oauth2.Consumer(self.consumer_key, self.consumer_secret)
    try:
      temp_bus_list = []
      total = -1
      while len(temp_bus_list) < total or total == -1:
        url_params['offset'] = len(temp_bus_list) 
        encoded_params = urllib.urlencode(url_params)
        url = 'http://api.yelp.com%s?%s' % (path, encoded_params)
        #print 'URL: %s' % (url,)
        # Sign the URL
        oauth_request = oauth2.Request('GET', url, {})
        oauth_request.update({'oauth_nonce': oauth2.generate_nonce(),
                              'oauth_timestamp': oauth2.generate_timestamp(),
                              'oauth_token': self.token,
                              'oauth_consumer_key': self.consumer_key})

        token = oauth2.Token(self.token, self.token_secret)
        oauth_request.sign_request(oauth2.SignatureMethod_HMAC_SHA1(), consumer, token)
        signed_url = oauth_request.to_url()

        conn = urllib2.urlopen(signed_url, None)
        try:
          response = json.loads(conn.read())
          total = response['total']
        except:
          total = 0
        finally:
          conn.close()
        temp_bus_list = temp_bus_list + response['businesses']
      #narrow down the options
      if response['total'] > 1:
        i = 0
        indx = {}
        while i < response['total']:
          if options['tel']:
            factual_phone = self.non_decimal.sub('', options['tel'])
            if temp_bus_list[i].get('phone','0') == factual_phone:
              indx[i] = 1
          elif options['address']:
            factual_address = options['address'].lower()
            if temp_bus_list[i]['location'].get('address',False):
              for address_entry in temp_bus_list[i]['location']['address']:
                if address_entry.lower() == factual_address:
                  indx[i] = 1
          else:
            factual_name = options['name'].lower()
            if temp_bus_list[i]['name'].lower() == factual_name:
              indx[i] = 1
          i += 1
        #copy only the matched businesses
        new_businesses = []
        for i in indx.keys():
          new_businesses.append(temp_bus_list[i])
        response['businesses'] = new_businesses
        response['total'] = len(new_businesses)
        #merge businesses into one
    except urllib2.HTTPError, error:
      response = json.loads(error.read())
    except Exception as e:
      print "error yelping/merging entries: %s" % (e)

    return {'response':response,'url': signed_url}

