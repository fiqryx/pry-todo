### Run the Application
Start http server with default configuration:
```bash
go run . serve
# OR
go run . serve --host=127.0.0.1 -p 9000
```

### (Optional) Enable Hot Reloading with [Air](https://github.com/air-verse/air)
Install Air if you don't have it:
```bash
go install github.com/air-verse/air@latest
```
Run the server with hot reload
```bash
air serve
# or
air serve --host=127.0.0.1 --port=9000
```

---


### Database Migration
Run database migrations using GORM's AutoMigrate feature. This will automatically create or update tables based on your Go model definitions.

```bash
go run . migrate
# or
go run . migrate -D
```
Make sure to register your models in the `DBRegistry.models` at [/registry/database.go](registry/database.go).

### Database backup
command to backup database with registry tables:
```bash
go run . db:backup
# or
go run . db:backup --output=./storage/backup/20250518
```
Make sure to register your tables `DBRegistry.tables` at [/registry/database.go](registry/database.go).

---

### Additional CLI Commands
This project also supports other command-line operations:

#### Create repository:
```bash
go run . make:repo --name=user
```
After created adjust registry at [/registry/repository.go](registry/repository.go).

#### Create service:
```bash
go run . make:service --name=auth
```
After created adjust registry at [/registry/services.go](registry/services.go).

#### Create controller:
```bash
go run . make:controller --name=home
```
After created adjust registry at [/registry/controller.go](registry/controller.go).

#### Create factory
command to create factory:
```bash
go run . make:factory --name=user
```

with specific output directory, default directory is [/database/factory](database/factory/)
```bash
go run . make:factory --name=user --output=./factory
# or
go run . make:factory --n user -o ./factory
```

#### Database seeding
command to run database seed with the `factories`:
```bash
go run . db:seed
```
Make sure the configuration `DBRegistry.factories` at [/registry/database.go](registry/database.go).


### How to use rename module
This rename is for renaming module of golang project, this bellow example of usage:
```bash
# With default paths (backend/src → services/src)
./rename.sh

# With custom paths
./rename.sh "old/module/path" "new/module/path"
```

### How to Build
```bash
$ go build -o ./bin/api
# with vendor
$ go build -mod=vendor -o ./bin/api
```