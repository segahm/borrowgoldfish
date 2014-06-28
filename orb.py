# Import the relevant libraries
import urllib2
import json
import urllib
import time
import csv
import unicodecsv


attempts = 0
ATTEMPT_LIMIT = 3

LIMIT_ENTRIES = 100
TOTAL_LIMIT = 2500

OUT_DATA_FILE = 'Crawler/orb.csv'

API_KEY = '00f12230-ba85-4dfe-b57a-8f08ca2c2bc1'
URL = 'http://api.orb-intelligence.com:8095/1/search/companies?api_key={0}&industry=Restaurants&country=United%20States&employees={1}&limit={2}&offset={3}'


#50-200 (422), 10-50 (933), 1-10 (602)
def fetch(url):
	global attempts,ATTEMPT_LIMIT,LIMIT_ENTRIES
	response = urllib2.urlopen(url)
	#print url
	json_raw = response.read()
	json_data = json.loads(json_raw)
	if json_data['code'] == 'OK':
		attempts = 0
		return json_data
	elif attempts < self.attempt_limit:
		attempts = attempts+1
		print json_data['code']
		print "message: " % json_data.get('message','')
		print 'retrying again...'
		time.sleep(2)
		return fetch(url)
	else:
		print json_data['code']
		print "message: " % json_data.get('message','')
		print "attempts: %d" % (attempts)
		attempts = 0
		return False


def main():
	global URL, TOTAL_LIMIT

	with open(OUT_DATA_FILE, 'wb') as outfile:
		writer = unicodecsv.writer(outfile,encoding='utf-8')
		header = ['name','names','website','webdomains','address','facebook_account',
					'twitter_account','googleplus_account','pinterest_account','linkedin_account',
					'year_founded','categories','description','phone','email']
		writer.writerow(header)
		count_requests = 0
		employees = ['1-10', '10-50', '50-200']
		empl = 0
		while empl < len(employees):
			employees_cat = employees[empl]
			offset = 0
			last_is_empty = False
			while count_requests < TOTAL_LIMIT and not last_is_empty:
				url = (URL).format(API_KEY,employees_cat,LIMIT_ENTRIES,offset)
				json_data = fetch(url)

				if json_data != False:
					count = len(json_data['result_set'])
					if count == 0:
						last_is_empty = True 
					print 'found %d records' % (count)
					offset += count
					count_requests += count
					for restaurant in json_data['result_set']:
						row = []
						for el in header:
							row.append(restaurant[el])
						writer.writerow(row)
			empl += 1
  
if __name__ == '__main__':
  main()