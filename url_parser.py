#!/usr/bin/python -tt
import csv
import json

ID_DATA_FILE = './Crawler/file2.txt'
OUT_DATA_FILE = './Crawler/social_ids.csv'

def main():
	with open(OUT_DATA_FILE, 'wb') as outfile:
		writer = csv.writer(outfile)
		header = ['link','twitter','emails']
		writer.writerow(header)

		with open(ID_DATA_FILE) as infile:
			elements = json.load(infile)
			for el in elements:
				emails = 1 #el['emailList']
				twitters = 1 #el['twitterList']
				row = [el['url'],twitters,emails]
				writer.writerow(row)
  
if __name__ == '__main__':
  main()