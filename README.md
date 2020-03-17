# JIRA Report Generator

This project will collect issue from JIRA and calculate cycle time and lead time based on specific work flow.
To use this input your email and api token in index.js to allow this code to connect to JIRA.

## Example usage

node index.js --username=your@email.com --password=xxx --project=INV --subProject=dbs

## Report Generated

```
JIRA REPORT

INV-61 cycle time 9 days, lead time 0 days
INV-58 cycle time 11 days, lead time 10 days
INV-53 cycle time 7 days, lead time 0 days
INV-52 cycle time 11 days, lead time 10 days
INV-51 cycle time 11 days, lead time 0 days
------------------------------------------------------------------------------
AVERAGE cycle time 9.8 days, lead time 4 days
```
