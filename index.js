const axios = require("axios");
const moment = require("moment");
const parseArgv = require("minimist");

// Parse the argument
const argv = parseArgv(process.argv.slice(2));
const validateArgv = argv => {
  return argv.username && argv.password && argv.project && argv.subProject;
};

// Validate required argument
if (!validateArgv(argv)) {
  console.log(
    "Missing username or password or project or subProject arguments"
  );
  return false;
}
const username = argv.username;
const password = argv.password;
const project = argv.project;
const sub_project = argv.subProject;

const initialResult = {
  startDate: new Date(),
  testingFinish: new Date(),
  endDate: new Date()
};

const datesAreOnSameDay = (firstDate, secondDate) =>
  firstDate.getFullYear() === secondDate.getFullYear() &&
  firstDate.getMonth() === secondDate.getMonth() &&
  firstDate.getDate() === secondDate.getDate();

const calculateBusinessHours = (startDate, endDate) => {
  let m = moment(startDate);
  let roundUp =
    m.minute() || m.second() || m.millisecond()
      ? m.add(1, "hour").startOf("hour")
      : m.startOf("hour");
  let hourWork = 0;
  while (!roundUp.isAfter(moment(endDate))) {
    roundUp.add(1, "hours");
    if (
      roundUp.get("hour") <= 18 &&
      roundUp.get("hour") >= 9 &&
      roundUp.weekday() > 0 &&
      roundUp.weekday() < 6
    ) {
      hourWork += 1;
    }
  }
  return hourWork;
};

axios
  .get("https://alterra.atlassian.net/rest/api/2/search", {
    auth: {
      username: username,
      password: password
    },
    params: {
      jql: `project = ${project} AND labels = ${sub_project} AND (type = Story OR type = Bug) AND status = Done ORDER BY resolutiondate ASC`,
      expand: "changelog",
      fields: "labels, assignee, status, created, issuetype"
    }
  })
  .then(function(response) {
    console.log(`\nJIRA REPORT ${sub_project.toUpperCase()} \n`);
    let count = 0;
    let totalCycleTime = 0;
    let totalLeadTIme = 0;
    console.log(
      "------------------------------------------------------------------------------"
    );
    console.log(
      "--------------------------- FINISHED CYCLE TIME ------------------------------"
    );
    console.log(
      "------------------------------------------------------------------------------\n"
    );
    response.data.issues.forEach(issue => {
      const key = issue.key;
      const issueTypeName = issue.fields.issuetype.name;
      const {
        startDate,
        testingFinish,
        endDate
      } = issue.changelog.histories.reduce(
        (oldResultHistory, currentHistory) => {
          const historyDate = new Date(Date.parse(currentHistory.created));
          return currentHistory.items.reduce((oldResultItem, currentItem) => {
            return {
              endDate:
                currentItem.toString && currentItem.toString === "Done"
                  ? historyDate
                  : oldResultItem.endDate,
              testingFinish:
                currentItem.toString && currentItem.toString === "Deploying"
                  ? historyDate
                  : oldResultItem.testingFinish,
              startDate:
                currentItem.toString && currentItem.toString === "Development"
                  ? historyDate
                  : oldResultItem.startDate
            };
          }, oldResultHistory);
        },
        initialResult
      );

      const currentCycleTime = calculateBusinessHours(startDate, endDate);
      const currentLeadTime = calculateBusinessHours(testingFinish, endDate);

      totalCycleTime = totalCycleTime + currentCycleTime;
      totalLeadTIme = totalLeadTIme + currentLeadTime;
      count = count + 1;

      // console.log(key, startDate, testingFinish, endDate)
      console.log(
        key,
        issueTypeName,
        `cycle time ${Math.floor(
          currentCycleTime / 9
        )} days ${currentCycleTime % 9} hours, lead time ${Math.floor(
          currentLeadTime / 9
        )} days ${currentLeadTime % 9} hours`
      );
    });
    console.log(
      "------------------------------------------------------------------------------"
    );
    console.log(
      `AVERAGE cycle time ${Math.floor(
        totalCycleTime / count / 9
      )} days ${Math.round(
        (totalCycleTime / count) % 9
      )} hours, lead time ${Math.floor(
        totalLeadTIme / count / 9
      )} days ${Math.round((totalLeadTIme / count) % 9)} hours\n\n`
    );
  })
  .catch(function(error) {
    console.log(error);
  })
  .then(function() {
    let totalTimeRestore = 0;
    let count = 0;
    axios
      .get("https://alterra.atlassian.net/rest/api/2/search", {
        auth: {
          username: username,
          password: password
        },
        params: {
          jql: `project = ${project} AND labels = ${sub_project} AND (type = Story OR type = Bug) AND status != Done AND status != Cancelled AND status != Open AND status != "Selected for Development" ORDER BY resolutiondate ASC`,
          expand: "changelog",
          fields: "labels, assignee, status, created, issuetype"
        }
      })
      .then(function(response) {
        let count = 0;
        let totalCycleTime = 0;
        let totalLeadTIme = 0;
        console.log(
          "------------------------------------------------------------------------------"
        );
        console.log(
          "---------------------------- CURRENT CYCLE TIME ------------------------------"
        );
        console.log(
          "------------------------------------------------------------------------------\n"
        );
        response.data.issues.forEach(issue => {
          const key = issue.key;
          const issueTypeName = issue.fields.issuetype.name;
          const {
            startDate,
            testingFinish,
            endDate
          } = issue.changelog.histories.reduce(
            (oldResultHistory, currentHistory) => {
              const historyDate = new Date(Date.parse(currentHistory.created));
              return currentHistory.items.reduce(
                (oldResultItem, currentItem) => {
                  return {
                    endDate:
                      currentItem.toString && currentItem.toString === "Done"
                        ? historyDate
                        : oldResultItem.endDate,
                    testingFinish:
                      currentItem.toString &&
                      currentItem.toString === "Deploying"
                        ? historyDate
                        : oldResultItem.testingFinish,
                    startDate:
                      currentItem.toString &&
                      currentItem.toString === "Development"
                        ? historyDate
                        : oldResultItem.startDate
                  };
                },
                oldResultHistory
              );
            },
            initialResult
          );

          const currentCycleTime = calculateBusinessHours(startDate, endDate);
          const currentLeadTime = calculateBusinessHours(
            testingFinish,
            endDate
          );

          totalCycleTime = totalCycleTime + currentCycleTime;
          totalLeadTIme = totalLeadTIme + currentLeadTime;
          count = count + 1;

          // console.log(key, startDate, testingFinish, endDate)
          console.log(
            key,
            issueTypeName,
            `cycle time ${Math.floor(
              currentCycleTime / 9
            )} days ${currentCycleTime % 9} hours, lead time ${Math.floor(
              currentLeadTime / 9
            )} days ${currentLeadTime % 9} hours`
          );
        });
        console.log(
          "------------------------------------------------------------------------------"
        );
        console.log(
          `AVERAGE cycle time ${Math.floor(
            totalCycleTime / count / 9
          )} days ${Math.round(
            (totalCycleTime / count) % 9
          )} hours, lead time ${Math.floor(
            totalLeadTIme / count / 9
          )} days ${Math.round((totalLeadTIme / count) % 9)} hours\n\n`
        );
      })

      .catch(function(error) {
        console.log(error);
      })
      .then(function() {});
  });
