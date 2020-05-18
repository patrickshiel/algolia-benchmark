const algoliasearch = require('algoliasearch');
const args = require('minimist')(process.argv.slice(2));
const Bluebird = require('bluebird');
const { isEmpty } = require('lodash');

console.log(`Algolia Benchmark:`);
let iteration = 0;

const validateMandatoryArgs = ({ appId, apiKey, indexName }) => {
    const mandatoryArgs = { appId, apiKey, indexName };

    Object.keys(mandatoryArgs).map((key) => {
        if (isEmpty(mandatoryArgs[key])) {
            throw new Error(`Missing required arg "${key}"`);
        }
    });

    console.log({appId, indexName});
    return mandatoryArgs;
};

const getIndex = ({ appId, apiKey, indexName }) => {
    const algoliaClient = algoliasearch(appId, apiKey);
    return algoliaClient.initIndex(indexName);
}

const runBenchmark = async (index) => {
    const iter = iteration++;

    const { taskID } = await index.partialUpdateObject({
        objectID: 'google-oauth2|114815978733903856080',
        name: `Zac ${iter}`
    });

    const startTimer = process.hrtime();

    await index.waitTask(taskID);

    var elapsedSeconds = parseHrtimeToSeconds(process.hrtime(startTimer));

    console.log(`${iter}: task ${taskID} took ${elapsedSeconds} seconds`);
}

const parseHrtimeToSeconds = hrtime => {
    var seconds = (hrtime[0] + (hrtime[1] / 1e9)).toFixed(3);
    return seconds;
}

return Bluebird
    .resolve(validateMandatoryArgs(args))
    .then(getIndex)
    .then(index => {
        // loop benchmark x 10
        return [...Array(10)].reduce(
            (promise) => promise.then(() => runBenchmark(index)).then(() => Bluebird.delay(5000)),
            Bluebird.resolve()
        );
    })
    .catch(console.error);
