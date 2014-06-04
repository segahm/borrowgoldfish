import csv
import unicodecsv
from gplaces import GSearch


IN_DATA_FILE = './Crawler/data_input2.csv'
OUT_DATA_FILE = './Crawler/places_small.csv'
OFFSET = 0


     
def main():
	# AUTH_KEY = 'AIzaSyAD2PFsRBWs9LRZCeKE5yoJO3PITVlqmK8'	#production
	# AUTH_KEY = 'AIzaSyCx7idVBv7n4xtKjkKCHSdxnkL3LTFzqkU'	#development
	google = GSearch(
	    'AIzaSyCx7idVBv7n4xtKjkKCHSdxnkL3LTFzqkU',  #GOOGLE_AUTH_KEY
	    100000, #GOOGLE_LIMIT_ENTRIES      
	    10000,   #GOOGLE_CITY_RADIUS  # Define the radius (in meters) for city search
	    3)      #GOOGLE_ATTEMPT_LIMIT 

	with open(OUT_DATA_FILE, 'wb') as outfile:
		writer = unicodecsv.writer(outfile,encoding='utf-8')
		header = ['id','requested name','found name','website']
		writer.writerow(header)
		with open(IN_DATA_FILE) as infile:
			reader = csv.reader(infile, delimiter=',', quotechar='"')
			reader.next()
			count_elements = 0
			while count_elements < OFFSET:
				count_elements += 1
				reader.next()

			for row in reader:
				count_elements += 1
				id = row[0]
				address = {'street': row[3],'city': row[4],'state': row[5],'zipcode':row[2]}
				name = row[1]
				#address = {'street': '1544 Southmost Rd','city': 'Brownsville','state':'TX','zipcode': '78521'}
				#name = 'Montelongo Refresqueria'
				if "\n" not in row:
					print name
					company = google.request(address,name)
					if company != False:
						writer.writerow([id,name,company['found_name'],company['website']])
					else:
						break

if __name__ == '__main__':
  main()