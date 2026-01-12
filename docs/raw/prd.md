-----
## Spec
I'm building a SLEEk-looking, modern web-based reporting utility for me to collect account information for all my accounts with various financial institutions and present them to me in a consolidate view.
There's a main landing page with a left panel that allows me to specify the filter condition. The filter should have an as-of date field. It should also have a list of financial companies that I can choose to report from. There is a 'Report' button next to the as-of date. Once clicked, I should get the report in the right Panel with a consolidated view. The view should include account number, balance in dollar amount, date of the balance closest to the as-of date for each account. Accounts should be grouped by institution as I sometimes have multiple accounts with the same institute. There should be a sub total for institution and a grand total.
I have the user ID and password for each of the institutions. But I need you to figure out how to log into those companies and grab the account info , via API calls.
Institutions I have accounts include - Alpaca, Vanguard and TD Trade. It's CRITICAL for me to minimize the cost of calling such APIs. So please find free services whenever possible.

Amendment to specs - In the landing page, there should be a left panel with manuals such as Dashboard and Connections. 
- when the 'Dashboard' is clicked in the left panel, in the right panel i expect to see a filter section. 
  - for the MVP
    - I should be able to filter by the as-of date field. Note this is optional. If no date is provided, then the as-of date is the latest.
    - There should also be a refresh button or icon, once clicked it should retrieve the account info from the list of connected institutions and display them with account number, balance amount, actual as-of date. Accounts should be grouped at institution level with subtotal and a grand total as well.
  - post MVP, I will want to include a list of checkboxes for institutes in the filter section in addition to the as-of date
    
    
- when the 'Connection' is clicked in the left panel, I would like to see a list of institutions(as listed above) in the right panel, each with a connect icon and a status icon. for unconnected institues, I can click on the 'Connect' icon and be prompted to provide the credential to connect



--------
## Plan
When considering SnapTrade, make sure you research its documentation carefully. For how to establish connections, reference this page https://docs.snaptrade.com/docs/implement-connection-portal and recommend me the best solution you think.
If you consider other tools similar to SnapTrade, such as Plaid, Yodlee, pls do the similar thorough research.