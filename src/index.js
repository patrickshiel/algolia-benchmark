const algoliasearch = require('algoliasearch');
const argv = require('minimist')(process.argv.slice(2));
const Bluebird = require('bluebird');
const { get } = require('lodash');

console.log(`Algolia Benchmark:`);

let iteration = 0;
const MANDATORY_ARGS = ['appId', 'apiKey', 'indexName'];

const validateMandatoryArgs = (args) => {
    return MANDATORY_ARGS.reduce((parsedArgs, argName) => {
            const argValue = get(args, argName);
            if (!argValue) { throw new Error(`Missing required arg "${argName}"`); }
            parsedArgs[argName] = argValue;
            return parsedArgs;
        }, {});
};

const getIndex = ({appId, apiKey, indexName}) => {
    console.log({appId, indexName});
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
    .resolve(validateMandatoryArgs(argv))
    .then(getIndex)
    .then(index => {
        // loop benchmark x 10
        return [...Array(10)].reduce(
            (promise) => promise.then(() => runBenchmark(index)).then(() => Bluebird.delay(5000)),
            Bluebird.resolve()
        );
    })
    .catch(console.error);
