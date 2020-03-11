const axios = require('axios');
const moment = require('moment');

const username = 'ardian@alterra.id';
const password = '';
const project = 'INV';
const sub_project = 'regina';

const datesAreOnSameDay = (first, second) =>
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate();

const calculateBusinessDays = (firstDate, secondDate) => {
  // EDIT : use of startOf
  let day1 = moment(firstDate).startOf('day');
  let day2 = moment(secondDate).startOf('day');
  // EDIT : start at 1
  let adjust = 1;

  if((day1.dayOfYear() === day2.dayOfYear()) && (day1.year() === day2.year())){
      return 0;
  }

  if(day2.isBefore(day1)){
      const temp = day1;
      day1 = day2;
      day2 = temp;
  }

  //Check if first date starts on weekends
  if(day1.day() === 6) { //Saturday
      //Move date to next week monday
      day1.day(8);
  } else if(day1.day() === 0) { //Sunday
      //Move date to current week monday
      day1.day(1);
  }

  //Check if second date starts on weekends
  if(day2.day() === 6) { //Saturday
      //Move date to current week friday
      day2.day(5);
  } else if(day2.day() === 0) { //Sunday
      //Move date to previous week friday
      day2.day(-2);
  }

  const day1Week = day1.week();
  let day2Week = day2.week();

  //Check if two dates are in different week of the year
  if(day1Week !== day2Week){
      //Check if second date's year is different from first date's year
      if (day2Week < day1Week){
          day2Week += day1Week;
      }
      //Calculate adjust value to be substracted from difference between two dates
      // EDIT: add rather than assign (+= rather than =)
      adjust += -2 * (day2Week - day1Week);
  }
  
  return day2.diff(day1, 'days') + adjust;
}

axios.get('https://alterra.atlassian.net/rest/api/2/search', {
  auth: {
    username: username,
    password: password
  },
  params: {
    jql: `project = ${project} AND labels = ${sub_project} AND type = story AND status = Done`,
    expand: 'changelog',
    fields: 'labels, assignee, status, created',
  }
})
.then(function (response) {
  console.log('\nJIRA REPORT\n');
  let count = 0
  let totalCycleTime = 0
  let totalLeadTIme = 0
  console.log('------------------------------------------------------------------------------')
  console.log('--------------------------- FINISHED CYCLE TIME ------------------------------')
  console.log('------------------------------------------------------------------------------\n')
  response.data.issues.map(issue => {
    const key = issue.key
    let startDate = new Date()
    let testingFinish = new Date()
    let endDate = new Date()
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
    
    const currentCycleTime = calculateBusinessDays(startDate, endDate)
    const currentLeadTime = calculateBusinessDays(testingFinish, endDate)

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
  let totalTimeRestore = 0;
  let count = 0;
  axios.get('https://alterra.atlassian.net/rest/api/2/search', {
    auth: {
      username: username,
      password: password
    },
    params: {
      jql: `project = ${project} AND labels = ${sub_project} AND type = bug AND status = Done`,
      expand: 'changelog',
      fields: 'labels, assignee, status, created',
    }
  }).then(function (response) {
    console.log('------------------------------------------------------------------------------')
    console.log('----------------------------- TIME TO RESTORE --------------------------------')
    console.log('------------------------------------------------------------------------------\n')
    response.data.issues.map(issue => {
      const key = issue.key
      const createdDate = new Date(Date.parse(issue.fields.created))
      let endDate = new Date()
      issue.changelog.histories.map(history => {
        const historyDate = new Date(Date.parse(history.created))
        history.items.map(item => {
          if(item.toString && item.toString === 'Done') {
            endDate = historyDate
          }
        })
      })
      
      const currentTimeRestore = calculateBusinessDays(createdDate, endDate)
  
      totalTimeRestore = totalTimeRestore + currentTimeRestore
      count = count + 1
  
      // console.log(key, createdDate, endDate)
      console.log(key, 'time to restore', currentTimeRestore, 'days')
    })
    console.log('------------------------------------------------------------------------------')
    console.log('AVERAGE time to restore', (totalTimeRestore/count), 'days\n\n')
  })
  
  .catch(function (error) {
    console.log(error);
  })
  .then(function () {
  });
}).then(function () {
  let totalTimeRestore = 0;
  let count = 0;
  axios.get('https://alterra.atlassian.net/rest/api/2/search', {
    auth: {
      username: username,
      password: password
    },
    params: {
      jql: `project = ${project} AND labels = ${sub_project} AND type = story AND status != Done AND status != Cancelled AND status != Open AND status != "Selected for Development"`,
      expand: 'changelog',
      fields: 'labels, assignee, status, created',
    }
  }).then(function (response) {
    let count = 0
    let totalCycleTime = 0
    let totalLeadTIme = 0
    console.log('------------------------------------------------------------------------------')
    console.log('---------------------------- CURRENT CYCLE TIME ------------------------------')
    console.log('------------------------------------------------------------------------------\n')
    response.data.issues.map(issue => {
      const key = issue.key
      let startDate = new Date()
      let testingFinish = new Date()
      let endDate = new Date()
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
      
      const currentCycleTime = calculateBusinessDays(startDate, endDate)
      const currentLeadTime = calculateBusinessDays(testingFinish, endDate)
  
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
  });
});  