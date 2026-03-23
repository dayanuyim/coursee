#!/bin/sh

### Install SSL Certificatin

#### Use mkcert to generate cert

1. init mkcert

```
mkcert -install
```

2. create the cert

```
mkcert localhost 127.0.0.1 ::1
```

or create with the specified filenames

```
mkcert -cert-file localhost.pem \
       -key-file localhost.key \
           localhost 127.0.0.1 ::1
```

#### Use Openssl to create self-signed cert (not recommended)

The method is not recommended since browsers will warn with the CA verrification.

```
openssl genrsa -out server.key 2048

openssl req -x509 -newkey rsa:2048 -nodes \
    -keyout server.key \
    -out server.pem \
    -days 365
```
