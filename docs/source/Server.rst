Rest Methods
===============================

Contents:

.. toctree::
   :maxdepth: 2

GSD
*************
GET /

All servers
*************
GET /gameservers/
POST /gameservers/

Game server
*************
GET /gameservers/ID
PUT /gameservers/ID
DEL /gameservers/ID
GET /gameserver/ID/query

Power methods
*************
GET /gameserver/ID/on
GET /gameserver/ID/off
GET /gameserver/ID/restart

Files
*************
GET /gameserver/ID/configlist
GET /gameserver/ID/maplist
GET /gameserver/ID/FILEPATH
POST /gameserver/ID/FILEPATH

Console
*************
POST /gameserver/ID/console

Plugins
*************
GET /gameservers/ID/plugins/categories
GET /gameservers/ID/plugins/categories/CATEGORY
POST /gameservers/ID/plugins/search


GET /gameserver/ID/addonsinstalled/
