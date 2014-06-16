#!/usr/bin/python -tt
import csv
import json
from urlparse import urlparse

#ID_DATA_FILE = './Crawler/file2.txt'
#OUT_DATA_FILE = './Crawler/social_ids.csv'
IN_DATA_FILE = './Crawler/datafinity-in.txt'
OUT_DATA_FILE = './Crawler/full_email2.csv'


def main():
	results = {}
	with open(OUT_DATA_FILE, 'wb') as outfile:
		writer = csv.writer(outfile)
		header = ['domain','URLS','twitter','email']
		writer.writerow(header)

		with open(IN_DATA_FILE) as infile:
			elements = json.load(infile)
			for el in elements:
				domain = urlparse(el['url']).netloc
				if domain:
					row = results.get(domain,{'urls': [],'email': {},'twitter': {}})
					emails = el['result']['emailList']
					twitters = el['result']['twitterList']
					if (emails):
						for email in emails:
							row['email'][email] = 1
					if (twitters):
						for handle in twitters:
							row['twitter'][handle] = 1
					if (emails or twitters):
						row['urls'].append(el['url'])
					results[domain] = row
		for domain in results:
			vals = results[domain]
			row = [domain]
			str_url = ''
			for url in vals['urls']:
				str_url += url+';'
			row.append(str_url)
			#for handle in vals['twitter']:
			#	row.append(handle)
			for email in vals['email']:
				row.append(email)	
			writer.writerow(row)
  
if __name__ == '__main__':
  main()