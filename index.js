const axios = require('axios');
const moment = require('moment');

const username = 'ardian@alterra.id';
const password = '';
const project = 'INV';
const sub_project = 'dbs';

const datesAreOnSameDay = (first, second) =>
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate();

const calculateBusinessHours = (firstDate, secondDate) => {
  let m = moment(firstDate);
  let roundUp = m.minute() || m.second() || m.millisecond() ? m.add(1, 'hour').startOf('hour') : m.startOf('hour');
  let hourWork = 0;
  while (!roundUp.isAfter(moment(secondDate))) {
    roundUp.add(1, 'hours')
    if(roundUp.get('hour') <= 18 && roundUp.get('hour') >= 9 && roundUp.weekday() > 0 && roundUp.weekday() < 6) {
      hourWork += 1;
    }
  }
  return hourWork
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
    
    const currentCycleTime = calculateBusinessHours(startDate, endDate)
    const currentLeadTime = calculateBusinessHours(testingFinish, endDate)

    totalCycleTime = totalCycleTime + currentCycleTime
    totalLeadTIme = totalLeadTIme + currentLeadTime
    count = count + 1

    // console.log(key, startDate, testingFinish, endDate)
    console.log(key, `cycle time ${Math.floor(currentCycleTime/9)} days ${currentCycleTime % 9} hours, lead time ${Math.floor(currentLeadTime/9)} days ${currentLeadTime % 9} hours`)
  })
  console.log('------------------------------------------------------------------------------')
  console.log(`AVERAGE cycle time ${Math.floor((totalCycleTime/count)/9)} days ${Math.round((totalCycleTime/count) % 9)} hours, lead time ${Math.floor((totalLeadTIme/count)/9)} days ${Math.round((totalLeadTIme/count) % 9)} hours\n\n`)
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
      
      const currentTimeRestore = calculateBusinessHours(createdDate, endDate)
  
      totalTimeRestore = totalTimeRestore + currentTimeRestore
      count = count + 1
  
      // console.log(key, createdDate, endDate)
      console.log(key, `time to restore ${Math.floor(currentTimeRestore/9)} days ${currentTimeRestore % 9} hours`)
    })
    console.log('------------------------------------------------------------------------------')
    console.log(`AVERAGE time to restore ${Math.floor((totalTimeRestore/count)/9)} days ${Math.round((totalTimeRestore/count) % 9)} hours\n\n`)
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
      
      const currentCycleTime = calculateBusinessHours(startDate, endDate)
      const currentLeadTime = calculateBusinessHours(testingFinish, endDate)
  
      totalCycleTime = totalCycleTime + currentCycleTime
      totalLeadTIme = totalLeadTIme + currentLeadTime
      count = count + 1
  
      // console.log(key, startDate, testingFinish, endDate)
      console.log(key, `cycle time ${Math.floor(currentCycleTime/9)} days ${currentCycleTime % 9} hours, lead time ${Math.floor(currentLeadTime/9)} days ${currentLeadTime % 9} hours`)
    })
    console.log('------------------------------------------------------------------------------')
    console.log(`AVERAGE cycle time ${Math.floor((totalCycleTime/count)/9)} days ${Math.round((totalCycleTime/count) % 9)} hours, lead time ${Math.floor((totalLeadTIme/count)/9)} days ${Math.round((totalLeadTIme/count) % 9)} hours\n\n`)
  })
  
  .catch(function (error) {
    console.log(error);
  })
  .then(function () {
  });
});  