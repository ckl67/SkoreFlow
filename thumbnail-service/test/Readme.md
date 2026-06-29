# Local

## curl

```shell
 curl http://localhost:5001/health

 curl -X POST http://localhost:5001/createthumbnail \
    -H "Content-Type: application/json" \
     -d '{
       "pdf_path": "/home/christian/SkoreFlow_Project/SkoreFlow/thumbnail-service/test/storage/ballade.pdf",
       "output_path": "/home/christian/SkoreFlow_Project/SkoreFlow/thumbnail-service/test/storage/thumbnail_ballade.png"
     }'
```

```render

curl https://thumbnail-tgzi.onrender.com/health

 curl -X POST http://localhost:5001/createthumbnail \
    -H "Content-Type: application/json" \
     -d '{
       "pdf_path": "/home/christian/SkoreFlow_Project/SkoreFlow/thumbnail-service/test/storage/ballade.pdf",
       "output_path": "/home/christian/SkoreFlow_Project/SkoreFlow/thumbnail-service/test/storage/thumbnail_ballade.png"
     }'
```
