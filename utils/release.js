/**
 * This release script moves the prepared files from the nohash directory to the root
 * You have to sepcify the php version manually
 */
const fs = require("fs");
const jsonfile = require("jsonfile");

const phpVersion = Number(process.argv[2]);
if (!phpVersion || phpVersion < 10 || phpVersion > 100) {
    console.log(
        "php version [1st argument] should be a number like 72 yours is",
        phpVersion || "none"
    );
    process.exit();
}

fs.readdir("./nohash", (err, list) => {
    list.forEach(releaseIt);
});

function releaseIt(file) {
    const filePath = "./nohash/" + file;
    jsonfile.readFile(filePath, (err, manifest) => {
        if (err) return console.error({ err });

        const name = file.match(/php-(.*).json$/)[1];

        const has32bitHash = "hash" in manifest.architecture["32bit"];
        const has64bitHash = "hash" in manifest.architecture["64bit"];
        if (!has32bitHash || !has64bitHash) {
            console.error(
                "Missing hash for ",
                file,
                " // ",
                has32bitHash ? "32bit available" : "",
                has64bitHash ? "64bit available" : ""
            );
            return;
        }

        fs.renameSync(
            filePath,
            `../php${phpVersion}-${name.toLowerCase()}.json`
        );
    });
}
