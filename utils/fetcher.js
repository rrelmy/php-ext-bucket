const request = require("request");
const fs = require("fs");
const cheerio = require("cheerio");

const tempDirectory = "./nohash";
const statURL = "https://pecl.php.net/package-stats.php";

const phpVersion = Number(process.argv[2]);
if (!phpVersion || phpVersion < 5 || phpVersion > 10) {
    console.log(
        "php version [1st argument] should be a number like 7.4, yours is",
        phpVersion || "undefined"
    );
    process.exit();
}

if (!fs.existsSync(tempDirectory)) {
    fs.mkdirSync(tempDirectory);
}

request(statURL, (err, response, body) => {
    if (!body) {
        throw Error("Could not load site");
    }
    const $ = cheerio.load(body);
    const table = $('table[width="100%"][cellspacing="2"] tr td:first-child');
    console.info(`Found ${table.length} packages`);

    table.each(function () {
        let packageName = $(this).text();
        console.info(packageName);
        const packageSaveAs = tempDirectory + "/php-" + packageName + ".json";

        const packageURL = "https://pecl.php.net/package/" + $(this).text();
        setTimeout(function () {
            request(packageURL, (err, response, body) => {
                if (!body) return;
                const versionMatch = new RegExp(
                    packageName + "/([\\d.]+)/windows"
                );
                const version = body.match(versionMatch);
                if (!version || !version[1] || !/[\d.]+/.test(version[1])) {
                    return;
                }

                packageName = packageName.toLocaleLowerCase();

                const arcs = [64];
                arcs.forEach((arc) => {
                    request.head(
                        getDownloadURL(packageName, version[1], arc),
                        (err, response, body) => {
                            if (err || !response || response.statusCode > 399) {
                                console.log(
                                    `canceling ${packageName} x${arc}:', ${response.statusCode}`
                                );
                                return;
                            }
                            // replace package name
                            let template = fs
                                .readFileSync("./template.json")
                                .toString();
                            template = template.replace(
                                /__package__/g,
                                packageName
                            );
                            // replace package version
                            template = template.replace(
                                /__version__/g,
                                version[1]
                            );
                            // replace php version
                            template = template.replace(
                                /__phpversion__/g,
                                phpVersion
                            );
                            fs.writeFileSync(packageSaveAs, template);
                            console.log(
                                `saving ${packageName} x${arc}:', ${response.statusCode}`
                            );
                        }
                    );
                });
            });
        }, 1000);
    });
});

function getDownloadURL(package, version, arc) {
    return `https://windows.php.net/downloads/pecl/releases/${package}/${version}/php_${package}-${version}-${phpVersion}-ts-vc15-x${arc}.zip`;
}
