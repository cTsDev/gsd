Rest Methods
============

Contents:

.. toctree::
   :maxdepth: 2

Console
***

GSD provides a console for all servers.

You can connect to it via socket.io, each server has it's own room that needs authentication via a token

.. code-block:: html

    <script src="http://cdn.socket.io/socket.io-1.0.0-pre5.js"></script>
    <script>
      var socket = io('http://localhost:8031/0', {'query': 'token=123'});
      socket.on('console', function (data) {
        console.log(data);
      });
    </script>