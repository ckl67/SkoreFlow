package misc

// ======================================================================================
// INFRASTRUCTURE     | utils/         | "Atomic" functions, "blind" to business logic.
//                    |                | (Disk I/O, network calls, file manipulation).
// ======================================================================================
import (
	"fmt"
	"strings"
)

// RawArt Generated via : // figlet -c "SkoreFlow Backend     Server"
// Issue with : backticks (`)
// Replace all with ($)
func PrintAsciiVersion(version string) {
	rawArt := `
                 ____  _                  _____ _
                / ___|| | _____  _ __ ___|  ___| | _____      __
                \___ \| |/ / _ \| '__/ _ \ |_  | |/ _ \ \ /\ / /
                 ___) |   < (_) | | |  __/  _| | | (_) \ V  V /
                |____/|_|\_\___/|_|  \___|_|   |_|\___/ \_/\_/

   ____             _                  _       ____
  | __ )  __ _  ___| | _____ _ __   __| |     / ___|  ___ _ ____   _____ _ __
  |  _ \ / _$ |/ __| |/ / _ \ '_ \ / _$ |     \___ \ / _ \ '__\ \ / / _ \ '__|
  | |_) | (_| | (__|   <  __/ | | | (_| |      ___) |  __/ |   \ V /  __/ |
  |____/ \__,_|\___|_|\_\___|_| |_|\__,_|     |____/ \___|_|    \_/ \___|_|


`
	asciiArt := strings.ReplaceAll(rawArt, "$", "`")

	fmt.Printf("%s%s\n\n", asciiArt, version)
}
