# Utilization

## local

```shell

# 1) Run the thumbnail-service :
# See NPM scripts to run `thumbnail`service
# or
./venv/bin/gunicorn app:app --bind 0.0.0.0:5001

# 2) Run manual commands
# or
./venv/bin/python test.py

curl http://localhost:5001/health


curl -X POST http://localhost:5001/thumbnail/create \
     -H "Content-Type: application/json" \
      -d '{
        "input_path": "/home/christian/SkoreFlow_Project/SkoreFlow/microservice/thumbnail/test/storage/ballade.pdf",
        "output_path": "/home/christian/SkoreFlow_Project/SkoreFlow/microservice/thumbnail/test/storage/thumbnail_ballade.png",
        "max_size":256
      }'

curl -X POST http://localhost:5001/thumbnail/create \
     -H "Content-Type: application/json" \
      -d '{
        "input_path": "/home/christian/SkoreFlow_Project/SkoreFlow/microservice/thumbnail/test/storage/Mozart.png",
        "output_path": "/home/christian/SkoreFlow_Project/SkoreFlow/microservice/thumbnail/test/storage/thumbnail_Mozart_40.png",
        "max_size":40
      }'

```

## sandbox

For render.com

```shell

curl https://thumbnail-tgzi.onrender.com/health

```
