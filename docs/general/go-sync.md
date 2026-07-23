# ⚡ Synchronous vs Asynchronous in Go

## Synchronous Execution (Default)

How it works: Code runs line by line, from top to bottom.
Behavior: Blocking. The program stops and waits for a task to complete before moving to the next line.
Example: Standard function calls (myFunction()).

```go
func main() {
    // 1. We start the task and WAIT
    Download_File()

    // 2. This line will ONLY be executed ONCE the download has finished
    fmt.Println("Processing complete")
}
```

## Asynchronous Execution

How it works: Tasks are launched in the background, allowing the main program to keep running immediately.
Behavior: Non-blocking. In Go, this is done by starting a lightweight thread called a Goroutine using the go keyword (go myFunction()).

```go
func main() {
    // 1. Run the task in the background (non-blocking)
    go downloadFile()

    // 2. This line runs IMMEDIATELY, without waiting for the download to complete
    fmt.Println("Processing complete")
}
```

## 🛠 Orchestration Tools

Since the main program won't naturally wait for background tasks to complete, Go uses two primary tools:

- sync.WaitGroup: Pauses execution to wait for a group of goroutines to finish.
- Channels (chan): Passes data safely between async goroutines and sync code.
