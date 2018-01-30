# Usage

## 1. Fetch the list of extensions and prepare files

    node fetcher.js

## 2. Hash all the architectures

    node hash.js 32
    node hash.js 64

## 3. Release
Just moves the prepared manifests from to the root

    node release.js 72