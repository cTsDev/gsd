Authentication
===============================

Contents:

.. toctree::
   :maxdepth: 2

   
Requests
*************
All REST requests should be made with a X-Access-Token header containing either a key or an access token.

Request::
 
  GET : /gameservers/0/
  X-Access-Token: 123

  
Tokens
*************
"God" users can be set in the "tokens" setting of GSD. These tokens have all permissions.
keys.json::

  "tokens": [
      "123"
  ]
    
Keys and Permissions
*************
The "keys.json" file contains a list of users and permissions. You can see the keys.json.example file for a full example.

keys.json::

  {
      "key123456": {
          "services": [0,1,2,3],
          "permissions":["services:new","services:list","service:get","service:update","service:delete","service:power","service:files","service:query","service:console","service:addons","ftp"]
       }
  }

The key is the key that will be used to access GSD. 
Services is a list of all server ids.
Permissions is a list of all the permissions the key has access to.

================  ========================================================
Permission        Description
================  ========================================================
services:new      Can create new servers                    
services:list     Can list all servers                     
service:get       Can retrieve information about a service 
service:update    Can change a service's settings 
service:delete    Can delete a service 
service:power     Can turn on / off a service 
service:files     Can edit a service's files 
service:query     Can retrieve query data for a service 
service:console   Can read a service's console 
service:addons    Can retrieve an addon's list and install addons 
service:ftp       UNUSED   
================  ========================================================
