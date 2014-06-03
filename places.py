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
ATTEMPT_LIMIT = 2

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
	location = getLoc(address)
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
	address = ['2350 N Expressway,Brownsville,TX,78521','4695 Southmost Rd,Brownsville,TX,78521','3305 E 26th St,Brownsville,TX,78521','1544 Southmost Rd,Brownsville,TX,78521','252 Paredes Line Rd,Brownsville,TX,78521','755 Milpa Verde,Brownsville,TX,78521','2974 East Ave,Brownsville,TX,78521','2124 Boca Chica Blvd,Brownsville,TX,78521','6031 Southmost Rd,Brownsville,TX,78521','3355 International Blvd,Brownsville,TX,78521','7102 Padre Island Hwy,Brownsville,TX,78521','2155 Paredes Line Rd,Brownsville,TX,78521','1191 Ruben Torres Blvd,Brownsville,TX,78521','7395 Padre Island Hwy,Brownsville,TX,78521','1122 Fm 802,Brownsville,TX,78521','1700 Southmost Rd,Brownsville,TX,78521','2403 Boca Chica Blvd,Brownsville,TX,78521','8128 Boca Chica Blvd,Brownsville,TX,78521','119 Billy Mitchell Blvd,Brownsville,TX,78521','2370 N Expressway,Brownsville,TX,78521','435 Old Prt,Brownsville,TX,78521','4025 Boca Chica Blvd,Brownsville,TX,78521','5455 Boca Chica Blvd,Brownsville,TX,78521','2474 Boca Chica Blvd,Brownsville,TX,78521','2121 International Blvd,Brownsville,TX,78521','3025 Boca Chica Blvd,Brownsville,TX,78521','1627 E Price Rd,Brownsville,TX,78521','6418 Padre Island Hwy,Brownsville,TX,78521','2576 Rockwell Dr,Brownsville,TX,78521','3704 Boca Chica Blvd,Brownsville,TX,78521','349 Paredes Line Rd,Brownsville,TX,78521','2912 Boca Chica Blvd,Brownsville,TX,78521','2335 Boca Chica Blvd,Brownsville,TX,78521','226 Security Dr,Brownsville,TX,78521','2804 East Ave,Brownsville,TX,78521','2200 Boca Chica Blvd,Brownsville,TX,78521','5487 Boca Chica Blvd,Brownsville,TX,78521','2921 Boca Chica Blvd,Brownsville,TX,78521','755 Milpa Verde,Brownsville,TX,78521','2804 Boca Chica Blvd,Brownsville,TX,78521','1629 E Price Rd,Brownsville,TX,78521','2370 N Expressway,Brownsville,TX,78521','6170 Padre Island Hwy,Brownsville,TX,78521','2207 E Price Rd,Brownsville,TX,78521','1700 Southmost Rd,Brownsville,TX,78521','3194 Southmost Rd,Brownsville,TX,78521','401 Paredes Line Rd,Brownsville,TX,78521','3155 International Blvd,Brownsville,TX,78521','1480 N Expressway,Brownsville,TX,78521','2588 Rockwell Dr,Brownsville,TX,78521','2300 International Blvd,Brownsville,TX,78521','334 Paredes Line Rd,Brownsville,TX,78521','6955 Boca Chica Blvd,Brownsville,TX,78521','3155 International Blvd,Brownsville,TX,78521','3516 Coffeeport Rd,Brownsville,TX,78521','5059 Boca Chica Blvd,Brownsville,TX,78521','7877 Boca Chica Blvd,Brownsville,TX,78521']
	#place = getInfo(address,name)
	
	#print '%s: %s\n' % (place['name'], place['url'])
	i = 0
	while i < 3:
		this_address = address[i].split(',')
		city = this_address[len(this_address)-3]
		state = this_address[len(this_address)-2]
		zipcode = this_address[len(this_address)-1]
		if len(this_address) > 3:
  			print getLoc(city,state,zipcode,this_address[0])
  		else:
  			print getLoc(city,state,zipcode,False)
  		i = i+1

if __name__ == '__main__':
  main()