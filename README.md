# wavedox

### Setup

    $ bundle install

### Run

Web

    $ rails s

Worker

    $ iron_worker run ./worker/{file}.worker

### Deploy

Web

    $ git push heroku master

Worker

    $ iron_worker upload ./worker/{file}.worker
