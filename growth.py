#!/usr/bin/python -tt

from factual import Factual
import csv
import copy
import json

#must not exceed 10,000 (daily limitation)
LIMIT_ENTRIES = 10000
LIMIT_REQUEST_ENTRIES = 500
# burst limit for Factual requests
LIMIT_BURST_MINUTE = 500    # not implemented currently

DEBUG_WRITE_AGGREGATE_SUMMARY_ONLY = False
KEY = 'K23H6A5NTelYGN496SMLbikTcwyp71hoboh3rLv3'
SECRET = 'CNomvaXPlvgCDrIpb3FqPhIhZGwWIusGiCpn6Dzp'

ID_DATA_FILE = 'factual_ids.csv'
OUT_DATA_FILE = 'social_ids.csv'

factual = Factual(KEY, SECRET)
cquery = factual.table('crosswalk')

# return a twitter id or False if no associated twitter id found
def findTwitter(factual_business_id):
	result = False
	try:
		q2 = cquery.filters({'factual_id': factual_business_id,'namespace': 'twitter'}).select('factual_id,namespace_id')
		data = q2.data()
		if data:
			result = data[0]['namespace_id']
	except Exception as e:
		print "findTwitter error: %s" % (e)
	return result


def main():
	with open(OUT_DATA_FILE, 'wb') as outfile:
		writer = csv.writer(outfile)
		header = ['id','twitter']
		writer.writerow(header)
		with open(ID_DATA_FILE) as infile:
			reader = csv.reader(infile, delimiter='\t', quotechar='"')
			for row in reader:
				if "\n" not in row:
					id = row[0]
					twitter = findTwitter(id)
					writer.writerow([id,twitter])
					print "%s" % (twitter)
  
if __name__ == '__main__':
  main()