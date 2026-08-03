# Utilization

## local

```shell

# 1) Run the thumbnail-service :
make run

# Health
curl http://localhost:5001/health

#Version
curl http://localhost:5001/version

# Log level
curl http://localhost:5001/loglevel
curl "http://localhost:5001/loglevel?log_level=debug"


curl -X POST http://localhost:5001/thumbnail/create \
     -H "Content-Type: application/json" \
      -d '{
        "input_path": "/home/christian/SkoreFlow_Project/SkoreFlow/microservices/thumbnail/tests/storage/ballade.pdf",
        "output_path": "/home/christian/SkoreFlow_Project/SkoreFlow/microservices/thumbnail/tests/storage/thumbnail_ballade.png",
        "max_size":256
      }'

curl -X POST http://localhost:5001/thumbnail/create \
     -H "Content-Type: application/json" \
      -d '{
        "input_path": "/home/christian/SkoreFlow_Project/SkoreFlow/microservices/thumbnail/tests/storage/ballade.pdf",
        "output_path": "/home/christian/SkoreFlow_Project/SkoreFlow/microservices/thumbnail/tests/storage/thumbnail_ballade.png",
        "max_size":256,
        "log_level": "debug"
      }'

curl -X POST http://localhost:5001/thumbnail/create \
     -H "Content-Type: application/json" \
      -d '{
        "input_path": "/home/christian/SkoreFlow_Project/SkoreFlow/microservices/thumbnail/test/storage/Mozart.png",
        "output_path": "/home/christian/SkoreFlow_Project/SkoreFlow/microservices/thumbnail/test/storage/thumbnail_Mozart_40.png",
        "max_size":40
      }'

```

## sandbox

For render.com

```shell

curl https://thumbnail-tgzi.onrender.com/health

```
