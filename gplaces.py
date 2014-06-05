# Import the relevant libraries
import urllib2
import json
import urllib
import time

# Set the Places API key for your application
#AUTH_KEY = 'AIzaSyAD2PFsRBWs9LRZCeKE5yoJO3PITVlqmK8'	#production
AUTH_KEY = 'AIzaSyCx7idVBv7n4xtKjkKCHSdxnkL3LTFzqkU'	#development

# Define the radius (in meters) for city search
RADIUS = 10000

attempts = 0
ATTEMPT_LIMIT = 3

LIMIT_ENTRIES = 12000
OFFSET = 0

count_requests = 0

class GSearch:
	def __init__(self, key,limit, default_city_radius, throttle_limit):
		global LIMIT_ENTRIES,AUTH_KEY,RADIUS,ATTEMPT_LIMIT
		try:
			self.limit = limit
		  	self.key = key
		  	self.radius = default_city_radius
		  	self.attempt_limit = throttle_limit
		except:
			self.limit = LIMIT_ENTRIES
			self.key = AUTH_KEY
			self.radius = RADIUS
			self.attempt_limit = ATTEMPT_LIMIT
			print 'GPlaces: Using defaults'
			#defaults

	def fetch(self, url):
		global attempts
		response = urllib2.urlopen(url)
		print url
		json_raw = response.read()
		json_data = json.loads(json_raw)
		if json_data['status'] == 'OK':
			attempts = 0
			return json_data
		elif json_data['status'] == 'OVER_QUERY_LIMIT' and attempts < self.attempt_limit:
			attempts = attempts+1
			print 'waiting'
			time.sleep(2)
			return self.fetch(url)
		else:
			print json_data['status']
			print json_data.get('error_message','')
			print "attempts: %d" % (attempts)
			attempts = 0
			return False

	# def getLoc(city,state,zipcode,street):
	# 	try:
	# 		if street != False:
	# 			compontents = 'country:us|administrative_area:%s|postal_code:%s|locality:%s' % (state,zipcode,urllib.quote(city))
	# 	except NameError:
	# 		street = False
	# 	if street == False:
	# 		street = city
	# 		compontents = 'country:us|administrative_area:%s|postal_code:%s' % (state,zipcode)

	# 	url = ('https://maps.googleapis.com/maps/api/geocode/json?address=%s&sensor=false'
	# 		'&region=us&components=%s&key=%s') % (urllib.quote(street),compontents,self.key)
	# 	json_data = fetch(url)

	# 	location = False
	# 	if json_data != False and len(json_data['results']) > 0:
	# 		print 'number of results: %d' % (len(json_data['results']))
	# 		loc = json_data['results'][0]['geometry']['location']
	# 		location = '%.6f,%.6f' % (loc['lat'],loc['lng'])
	# 	return location

	def getReference(self, name,city,state,zipcode,street):  #location,name):
		# Compose a URL to query a predefined location with a radius of 5000 meters
		#url = ('https://maps.googleapis.com/maps/api/place/search/json?location=%s&keyword=%s'
		#		 '&radius=%s&sensor=false&key=%s') % (location, urllib.quote(name), self.radius, self.key)
		keyword = '%s near ' % (name)
		radius = self.radius	#city-wide search
		if street:
			keyword += street+','
			radius = 10
		keyword += '%s, %s' % (city,zipcode)
		print 'keyword: %s' % (keyword)
		types = 'restaurant|food|bar|bakery|cafe|meal_delivery|meal_takeaway'
		#types = 'restaurant|food|bar|bakery|cafe|meal_delivery|meal_takeaway|establishment'
		url = ('https://maps.googleapis.com/maps/api/place/textsearch/json?query=%s'
		         '&sensor=false&radius=%d&types=%s&key=%s') % (urllib.quote(keyword), radius,types,self.key)

		json_data = self.fetch(url)
		#if no results, try expanding the definition
		#if json_data == False:
		#	types += '|establishment'
		# Iterate through the results and print them to the console
		reference = ''
		if json_data != False:
			if len(json_data['results']) > 0:
				print 'found %d references' % (len(json_data['results']))
				reference = json_data['results'][0]['reference']
		return reference

	def getInfo(self, address, name):
		reference = False
		place = ''
		# location = getLoc(address['city'],address['state'],address['zipcode'],address.get('street',False))


		# if location:
		reference = self.getReference(name,address['city'],address['state'],address['zipcode'],address.get('street',False)) #getReference(location,name)
		
		if reference:
			url = ('https://maps.googleapis.com/maps/api/place/details/json'
						'?reference=%s&sensor=false&key=%s') % (reference, self.key)
			json_data = self.fetch(url)

			if json_data != False:
				place = json_data['result']
		return place

	#address = {'street': row[3],'city': row[4],'state': row[5],'zipcode':row[2]}
	def request(self, address,name):
		global count_requests

		if (address['street'] == ''):
			del address['street']
		if count_requests >= self.limit:
			print 'Limit Reached: %d no more requests accepted in this batch' % (count_requests)
			return False
		else:
			count_requests += 1
			place = self.getInfo(address,name)
			found_name = ''
			website = '-1'
			if place != '':
				website = place.get('website','1')
				found_name = place['name']
			return {'found_name': found_name,'website': website}