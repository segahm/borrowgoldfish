# Originally from http://sharebear.co.uk/blog/2009/09/17/very-simple-python-caching-proxy/
#
# Usage:
# A call to http://localhost:80000/example.com/foo.html will cache the file
# at http://example.com/foo.html on disc and not redownload it again. 
# To clear the cache simply do a `rm *.cached`. To stop the server simply
# send SIGINT (Ctrl-C). It does not handle any headers or post data. 

import BaseHTTPServer
import hashlib
import os
import urllib2

class CacheHandler(BaseHTTPServer.BaseHTTPRequestHandler):
    def do_GET(self):
      m = hashlib.md5()
      m.update(self.path)
      cache_filename = m.hexdigest() + ".cached"
      if os.path.exists(cache_filename):
          print "Cache hit"
          data = open(cache_filename).readlines()
      else:
          print "Cache miss"
          data = urllib2.urlopen("http:/" + self.path).readlines()
          open(cache_filename, 'wb').writelines(data)
      self.send_response(200)
      self.end_headers()
      self.wfile.writelines(data)

def run():
    server_address = ('', 8000)
    httpd = BaseHTTPServer.HTTPServer(server_address, CacheHandler)
    httpd.serve_forever()

if __name__ == '__main__':
    run()