const util = require("util");
const fs = require("fs");
const streamPipeline = util.promisify(require("stream").pipeline);
const jsonfile = require("jsonfile");
const hasha = require("hasha");
const fetch = require("node-fetch");

const bit = process.argv[2];
if (bit != 32 && bit != 64) {
    console.log("bit [1st argument] must be 32 or 64, yours is", bit || "none");
    process.exit();
}
const key = bit + "bit";
if (process.argv[3]) {
    hashIt(process.argv[3]);
} else {
    fs.readdir("./nohash", (err, list) => {
        list.forEach(hashIt);
    });
}

const fetchOptions = {
    headers: {
        "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:62.0) Gecko/20100101 Firefox/62.0",
    },
};

function fetchHash(url) {
    return new Promise((resolve, reject) => {
        fetch(url, fetchOptions)
            .then((response) => {
                if (!response.ok) {
                    reject({ message: "error getting", name, key });
                    return;
                }

                streamPipeline(
                    response.body,
                    hasha.stream({ algorithm: "sha256" }).on("data", (hash) => {
                        resolve(hash);
                    })
                );
            })
            .catch(function (err) {
                reject({ message: "error geting", name, key, err });
            });
    });
}

async function hashIt(file) {
    const name = file.match(/php-(.*).json$/)[1];
    const filePath = "./nohash/" + file;

    /**
     * jsonfile.readFile actually supports glob patterns to read multiple files
     */
    jsonfile.readFile(filePath, async (err, manifest) => {
        if (err) return console.error({ err });

        const hashes = await Promise.all(
            manifest.architecture[key].url.map((url) => fetchHash(url))
        );

        manifest.architecture[key]["hash"] = hashes;

        // save url and hash as string if only on is passed
        if (
            manifest.architecture[key]["url"].length === 1 &&
            manifest.architecture[key]["hash"].length === 1
        ) {
            manifest.architecture[key]["url"] =
                manifest.architecture[key]["url"][0];
            manifest.architecture[key]["hash"] =
                manifest.architecture[key]["hash"][0];
        }

        console.log("writing hash for " + name, key, hashes);
        jsonfile.writeFile(
            filePath,
            manifest,
            {
                spaces: 4,
            },
            (err) => {
                if (!err) return;
                console.error("cannot write to", filePath);
                console.error({
                    err,
                });
            }
        );
    });
}
