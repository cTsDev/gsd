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

Game server
***********
.. code-block:: bash

     GET /gameservers/ID

.. code-block:: bash

     PUT /gameservers/ID

.. code-block:: bash

     DEL /gameservers/ID

.. code-block:: bash

     GET /gameserver/ID/query

Power methods
*************
.. code-block:: bash

     GET /gameserver/ID/on

.. code-block:: bash

     GET /gameserver/ID/off

.. code-block:: bash

     GET /gameserver/ID/restart

Files
*****
.. code-block:: bash

     GET /gameserver/ID/configlist

.. code-block:: bash

     GET /gameserver/ID/maplist

.. code-block:: bash

     GET /gameserver/ID/FILEPATH

.. code-block:: bash

     POST /gameserver/ID/FILEPATH

Console
*******
.. code-block:: bash

     POST /gameserver/ID/console

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

     GET /gameserver/ID/addonsinstalled/
