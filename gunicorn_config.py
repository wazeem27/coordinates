bind = '0.0.0.0:8000'
workers = 3
timeout = 900  # Set timeout to 15 minutes (600 seconds)

pythonpath = '/home/ubuntu/webapp/coordinates'
wsgi_app = 'coordinates.wsgi:application'
