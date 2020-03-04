const axios = require('axios');

const username = 'ardian@alterra.id';
const password = 'api token from jira';

const datesAreOnSameDay = (first, second) =>
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate();

const calcBusinessDays = (dDate1, dDate2) => { // input given as Date objects
  var iWeeks, iDateDiff, iAdjust = 0;
  if (dDate2 < dDate1) return -1; // error code if dates transposed
  if (datesAreOnSameDay(dDate1, dDate2)) return 0;
  var iWeekday1 = dDate1.getDay(); // day of week
  var iWeekday2 = dDate2.getDay();
  iWeekday1 = (iWeekday1 == 0) ? 7 : iWeekday1; // change Sunday from 0 to 7
  iWeekday2 = (iWeekday2 == 0) ? 7 : iWeekday2;
  if ((iWeekday1 > 5) && (iWeekday2 > 5)) iAdjust = 1; // adjustment if both days on weekend
  iWeekday1 = (iWeekday1 > 5) ? 5 : iWeekday1; // only count weekdays
  iWeekday2 = (iWeekday2 > 5) ? 5 : iWeekday2;

  // calculate differnece in weeks (1000mS * 60sec * 60min * 24hrs * 7 days = 604800000)
  iWeeks = Math.floor((dDate2.getTime() - dDate1.getTime()) / 604800000)

  if (iWeekday1 < iWeekday2) { //Equal to makes it reduce 5 days
    iDateDiff = (iWeeks * 5) + (iWeekday2 - iWeekday1)
  } else {
    iDateDiff = ((iWeeks + 1) * 5) - (iWeekday1 - iWeekday2)
  }

  iDateDiff -= iAdjust // take into account both days on weekend

  return (iDateDiff + 1); // add 1 because dates are inclusive
}

axios.get('https://alterra.atlassian.net/rest/api/2/search', {
  auth: {
    username: username,
    password: password
  },
  params: {
    jql: 'project = INV AND labels = dbs AND type = story AND status = Done',
    expand: 'changelog',
    fields: 'labels, assignee, status, created',
  }
})
.then(function (response) {
  console.log('\nJIRA REPORT\n');
  let count = 0
  let totalCycleTime = 0
  let totalLeadTIme = 0
  response.data.issues.map(issue => {
    const key = issue.key
    let startDate, testingFinish, endDate
    issue.changelog.histories.map(history => {
      const historyDate = new Date(Date.parse(history.created))
      history.items.map(item => {
        if(item.toString && item.toString === 'Done') {
          endDate = historyDate
        }
        if(item.toString && item.toString === 'Deploying') {
          testingFinish = historyDate
        }
        if(item.toString && item.toString === 'Development') {
          startDate = historyDate
        }
      })
    })
    
    const currentCycleTime = calcBusinessDays(startDate, endDate)
    const currentLeadTime = calcBusinessDays(testingFinish, endDate)

    totalCycleTime = totalCycleTime + currentCycleTime
    totalLeadTIme = totalLeadTIme + currentLeadTime
    count = count + 1

    // console.log(key, startDate, testingFinish, endDate)
    console.log(key, 'cycle time', currentCycleTime, 'days, lead time', currentLeadTime, 'days')
  })
  console.log('------------------------------------------------------------------------------')
  console.log('AVERAGE cycle time', (totalCycleTime/count), 'days, lead time', (totalLeadTIme/count), 'days\n\n')
})
.catch(function (error) {
  console.log(error);
})
.then(function () {
  // always executed
});  