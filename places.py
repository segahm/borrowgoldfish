# Import the relevant libraries
import urllib2
import json
import urllib
import time

# Set the Places API key for your application
AUTH_KEY = 'AIzaSyCI5jQFj4v_xeAh5LuGrg4QEKm-4orfX08'

# Define the radius (in meters) for the search
RADIUS = 1000

attempts = 0
ATTEMPT_LIMIT = 3

def fetch(url):
	global attempts,ATTEMPT_LIMIT
	response = urllib2.urlopen(url)
	print url
	json_raw = response.read()
	json_data = json.loads(json_raw)
	if json_data['status'] == 'OK':
		attempts = 0
		return json_data
	else:
		if json_data['status'] == 'OVER_QUERY_LIMIT' and attempts < ATTEMPT_LIMIT:
			attempts = attempts+1
			print 'waiting'
			time.sleep(2)
			return fetch(url)
		else:
			print json_data['status']
			print "attempts: %d" % (attempts)
			attempts = 0
			return False

def getLoc(city,state,zipcode,street):
	try:
		if street != False:
			compontents = 'country:us|administrative_area:%s|postal_code:%s|locality:%s' % (state,zipcode,urllib.quote(city))
	except NameError:
		street = False
	if street == False:
		street = city
		compontents = 'country:us|administrative_area:%s|postal_code:%s' % (state,zipcode)

	url = ('https://maps.googleapis.com/maps/api/geocode/json?address=%s&sensor=false'
		'&key=%s&region=us&components=%s') % (urllib.quote(street), AUTH_KEY,compontents)
	json_data = fetch(url)

	location = False
	if json_data != False and len(json_data['results']) > 0:
		print 'number of results: %d' % (len(json_data['results']))
		loc = json_data['results'][0]['geometry']['location']
		location = '%.6f,%.6f' % (loc['lat'],loc['lng'])
	#location = '25.894044,-97.446678'
	return location

def getReference(location,name):
	# Compose a URL to query a predefined location with a radius of 5000 meters
	url = ('https://maps.googleapis.com/maps/api/place/search/json?location=%s&keyword=%s'
			 '&radius=%s&sensor=false&key=%s') % (location, urllib.quote(name), RADIUS, AUTH_KEY)
	#url = ('https://maps.googleapis.com/maps/api/place/textsearch/json?query=%s'
	#         '&sensor=false&key=%s') % (urllib.quote(keyword), AUTH_KEY)

	#types=restaurant|
	json_data = fetch(url)

	# Iterate through the results and print them to the console
	reference = ''
	if json_data != False:
	  for place in json_data['results']:
	  	#REMOVE THIS LOOP AFTER MAKING SURE SINGULAR RESULTS
		print '%s: %s\n' % (place['name'], place['reference'])
		reference = place['reference']
	return reference
		

def getInfo(address, name):
	reference = False
	this_address = address.split(',')
	city = this_address[len(this_address)-3]
	state = this_address[len(this_address)-2]
	zipcode = this_address[len(this_address)-1]
	if len(this_address) > 3:
		location = getLoc(city,state,zipcode,this_address[0])
	else:
		location = getLoc(city,state,zipcode,False)

	place = ''

	if location:
		reference = getReference(location,name)
	
	if reference:
		url = ('https://maps.googleapis.com/maps/api/place/details/json'
					'?reference=%s&sensor=false&key=%s') % (reference, AUTH_KEY)
		json_data = fetch(url)

		if json_data != False:
			place = json_data['result']
	return place

def main():
	name = 'La Esquinta'
	address = ['2350 N Expressway,Brownsville,TX,78521','4695 Southmost Rd,Brownsville,TX,78521','3305 E 26th St,Brownsville,TX,78521','1544 Southmost Rd,Brownsville,TX,78521']
	names = ['Chick-Fil-A','La Esquinta','Los Jacalitos Mexican Restaurant','Montelongo Refresqueria']
	#place = getInfo(address,name)
	
	#print '%s: %s\n' % (place['name'], place['url'])
	i = 0
	while i < 4:
		this_address = address[i].split(',')
		city = this_address[len(this_address)-3]
		state = this_address[len(this_address)-2]
		zipcode = this_address[len(this_address)-1]
		
		place = getInfo(address[i],names[i])
		if place != '':
	  		website = place.get('website',place.get('url','null'))
	  		print '%s: %s' % (place['name'],website)
	  	else:
	  		print '%s!!!' % (place['name'])
  		i = i+1

if __name__ == '__main__':
  main()