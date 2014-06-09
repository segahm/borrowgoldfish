#!/usr/bin/python -tt

import csv
import re


IN_PRODUCTION = './Crawler/production.csv'
IN_EMAILS = './Crawler/datafiniti.csv'
OUT_DATA_FILE = './Crawler/datafiniti-mailing-list.csv'
OUT_JUNK = './Crawler/datafiniti-junk.csv'

phones_ids = {}
address_ids = {}
name_ids = {}
data = {}


# return a twitter id or False if no associated twitter id found
def formatPhone(phone_string):
    try:
        return '('+phone_string[0:3]+') '+phone_string[3:6]+'-'+phone_string[6:10]
    except Exception as e:
        return False

#loads zip codes for target counties
def loadIds():
    with open(IN_PRODUCTION) as csvfile:
        reader = csv.reader(csvfile, delimiter=',', quotechar='"')
        reader.next()
        for row in reader:
            if "\n" not in row:
                name = re.sub('[ \s\t]+',' ',re.sub('[^a-z]',' ', row[0].lower()))
                address = (row[5]+','+row[19]+','+row[18]).lower().replace("E", "East").replace("W", "West").replace(",,", ",").replace('  ',' ')
                id = row[1]
                phone = row[7]
                phones_ids[phone] = id
                address_ids[address] = id
                name_ids[name] = id
                data[id] = [phone,row[5],row[19],row[18],row[0],address,row[2]]

def main():
    loadIds()
    with open(IN_EMAILS) as csvfile:
        reader = csv.reader(csvfile, delimiter=',', quotechar='"')
        reader.next()
        with open(OUT_DATA_FILE, 'wb') as f:
            writer = csv.writer(f)
            writer.writerow(['id','email','match','phone','address','name','p_phone','p_address','p_city','p_state','p_name'])
            with open(OUT_JUNK, 'wb') as f:
                jwriter = csv.writer(f)
                jwriter.writerow(['email','name','phone','city','state','address'])
                for row in reader:
                    email = re.match('[_a-z0-9-\+]+(\.[_a-z0-9-\+]+)*@[a-z0-9-]+(\.[a-z0-9]+)*(\.[a-z]{2,})',row[19])
                    try:
                        email = email.group(0)
                    except Exception as e:
                        #print row[18]
                        #print "email error: %s" % (e)
                        continue
                    phone = formatPhone(row[8])
                    address = (row[1]+','+row[2]+','+row[3]).lower().replace("E", "East").replace("W", "West").replace(",,", ",").replace('  ',' ')
                    name = re.sub('[ \s\t]+',' ',re.sub('[^a-z]',' ', row[0].lower()))

                    id1 = False
                    id2 = False
                    id3 = False
                    if phone != False:
                        id1 = phones_ids.get(phone,False)
                    id2 = address_ids.get(address,False)
                    id3 = name_ids.get(name,False)

                    match = ''
                    id = False
                    if id1 != False:
                        id = id1
                        match = 'phone'
                    elif id2 != False:
                        id = id2
                        match = 'address'
                    elif id3 != False:
                        address_data = data[id3]
                        city = address_data[2]
                        state = address_data[3]
                        #name match is not enough - city and state must match too
                        #if (row[3]).lower().replace(",,", ",").replace('  ',' ') == (state).lower().replace(",,", ",").replace('  ',' '):
                        if (row[2]+','+row[3]).lower().replace(",,", ",").replace('  ',' ') == (city+','+state).lower().replace(",,", ",").replace('  ',' '):
                            id = id3
                            match = 'name'
                    if id != False:
                        writer.writerow([id,email,match,phone,address,name]+data[id])
                    else:
                        jwriter.writerow([email,row[0],phone,row[2].replace(",", "").replace('  ',' '),row[3].replace(",", "").replace('  ',' '),row[1]])

  
if __name__ == '__main__':
  main()