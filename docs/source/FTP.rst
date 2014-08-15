FTP
===============================

Contents:

.. toctree::
   :maxdepth: 2

   
Gametainers includes a flexible FTP module allowing you to easily provide access to end-users.

User login
*************
Users log in with A username followed by the server ID separated by a dash.
Example::
  testuser-123

Configuration
*************
Configuration file::

  "ftp":{
    "authurl":"http://www.mysite.com/ftpauth.php"
    "port":21,
    "host":"127.0.0.1"
  }

The user's username and password will be posted to this url for authentication, we highly recommend this is a secure (https) url.
Port and host are where the login information will bind to.

Authentication
*************
When a user logs in, the authurl is posted the full username the user provided and the password. You can authenticate this against your database or a webservice to make sure it is correct. You will need to split the username to determine the server.

Return a 200 to allow the user to log in, or 403 to tell GSD to deny the login.