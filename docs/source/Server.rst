Rest Methods
============

Contents:

.. toctree::
   :maxdepth: 2

GSD
***
.. code-block:: bash

     GET /


.. code-block:: js

    {
        "gsd_version": "0.003",
        "plugins": {
            "Team Fortress 2": {
                "file": "tf2"
            }
        },
        "settings": {
            "consoleport": 8031
        }
    }


All servers
***********
.. code-block:: bash

     GET /gameservers/

.. code-block:: js

        [
            {
                "query": {},
                "config": {
                    "name": "Minecraft",
                    "user": "myuser",
                    "path": "/home/my_server_path",
                    "gameport": 12345,
                    "plugin": "minecraft"
                },
                "status": 0,
                "variables": {
                    "-Djline.terminal=": "jline.UnsupportedTerminal",
                    "-Xmx": "512M",
                    "-jar": "minecraft_server.jar"
                }
            }
        ]


.. code-block:: bash

     POST /gameservers/
     {
         "config": {
             "name": "My new server",
             "user": "myuser",
             "path": "/home/my_server_path",
             "gameport": 12345,
             "plugin": "minecraft"
         },
         "variables": {
         }
     }

.. code-block:: js

     {
         "query": {},
         "config": {
             "name": "Minecraft",
             "user": "myuser",
             "path": "/home/my_server_path",
             "gameport": 12345,
             "plugin": "minecraft"
         },
         "status": 0,
         "variables": {
             "-Djline.terminal=": "jline.UnsupportedTerminal",
             "-Xmx": "512M",
             "-jar": "different_jar.jar"
         }
     }

Game server
***********
.. code-block:: bash

     GET /gameservers/ID

.. code-block:: js

     {
         "query": {},
         "config": {
             "name": "Minecraft",
             "user": "myuser",
             "path": "/home/my_server_path",
             "gameport": 12345,
             "plugin": "minecraft"
         },
         "status": 0,
         "variables": {
             "-Djline.terminal=": "jline.UnsupportedTerminal",
             "-Xmx": "512M",
             "-jar": "minecraft_server.jar"
         }
     }

.. code-block:: bash

     PUT /gameservers/ID
     {"variables":{"-jar":"different_jar.jar"}}

.. code-block:: js

     {
         "query": {},
         "config": {
             "name": "Minecraft",
             "user": "myuser",
             "path": "/home/my_server_path",
             "gameport": 12345,
             "plugin": "minecraft"
         },
         "status": 0,
         "variables": {
             "-Djline.terminal=": "jline.UnsupportedTerminal",
             "-Xmx": "512M",
             "-jar": "different_jar.jar"
         }
     }

.. code-block:: bash

     DEL /gameservers/ID

.. code-block:: js

   ok

.. code-block:: bash

     GET /gameservers/ID/query

.. code-block:: js

    {"motd":"My server", "numplayers":1, "maxplayers":8, "lastquery":123456, "map":"ctf_2fort, "players":["player_name"]}

Power methods
*************
.. code-block:: bash

     GET /gameservers/ID/on

.. code-block:: js

   ok

.. code-block:: bash

     GET /gameservers/ID/off

.. code-block:: js

   ok

.. code-block:: bash

     GET /gameservers/ID/restart

.. code-block:: js

   ok

Files
*****
.. code-block:: bash

     GET /gameservers/ID/configlist

.. code-block:: js

    {"core":["config.yml","locations.yml","modules.yml"]}

.. code-block:: bash

     GET /gameservers/ID/maplist

.. code-block:: js

    ["ctf_2fort","ctf_sawmill"]


.. code-block:: bash

     GET /gameservers/ID/file/FILEPATH

.. code-block:: js

     {"contents":"line\nline"}

.. code-block:: bash

     GET /gameservers/ID/folder/FILEPATH

.. code-block:: js

        [
            {
                "name": "World",
                "ctime": "2014-04-11T00:20:22.000Z",
                "mtime": "2014-04-11T00:20:22.000Z",
                "size": 4096,
                "filetype": "folder"
            },
            {
                "name": "banned-ips.json",
                "ctime": "2014-08-23T09:33:46.000Z",
                "mtime": "2014-08-23T09:33:46.000Z",
                "size": 2,
                "filetype": "file"
            }
        ]

.. code-block:: bash

     POST /gameservers/ID/file/FILEPATH
     {"contents":"newline\nline"}

     POST /gameservers/ID/file/FILEPATH
     {"url":"http://example.com/file_to_upload"}


Console
*******
.. code-block:: bash

     POST /gameservers/ID/console
     {"command":"help"}

Plugins
*******
.. code-block:: bash

     GET /gameservers/ID/plugins/categories

.. code-block:: js

    [{"name":"Admin Tools","count":6588,"id":"Admin Tools"}]


.. code-block:: bash

     GET /gameservers/ID/plugins/categories/CATEGORY

.. code-block:: js


    [
        {
            "website": "http://dev.bukkit.org/bukkit-plugins/accountlock",
            "description": "Allows you to password protect your account within the server, added security",
            "versions": [
                {
                    "game_versions": [
                        "CB 1.0.1-R1"
                    ],
                    "download": "http://dev.bukkit.org/media/files/563/350/accountLock.zip",
                    "version": "0.3"
                }
            ],
            "plugin_name": "AccountLock",
            "server": "bukkit",
            "authors": []
        }
    ]

.. code-block:: bash

     POST /gameservers/ID/plugins/search

.. code-block:: bash

     GET /gameservers/ID/addonsinstalled/
