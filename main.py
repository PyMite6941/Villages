import os

def get_village_data(village_name):
    """Simulates fetching data for a given village."""
    data = {
        "AlphaVillage": {"population": 1500, "resources": ["wood", "stone"]},
        "BetaHamlet": {"population": 800, "resources": ["food", "water"]},
        "GammaTown": {"population": 3000, "resources": ["metal", "gems"]},
    }
    return data.get(village_name, {"population": 0, "resources": []})

def list_villages():
    """Lists available villages."""
    return ["AlphaVillage", "BetaHamlet", "GammaTown"]

def main():
    print("Welcome to the Villages Project CLI!")
    print("Available commands: list, get <village_name>, exit")

    while True:
        try:
            raw = input("> ").strip()
            if not raw:
                continue
            parts = raw.split(maxsplit=1)
            action = parts[0]
            arg = parts[1] if len(parts) > 1 else ""

            if action == "list":
                villages = list_villages()
                print("Villages:")
                for village in villages:
                    print(f"- {village}")
            elif action == "get":
                if not arg:
                    print("Usage: get <village_name>")
                    continue
                data = get_village_data(arg)
                if data["population"] > 0:
                    print(f"Data for {arg}:")
                    print(f"  Population: {data['population']}")
                    print(f"  Resources: {', '.join(data['resources'])}")
                else:
                    print(f"Village '{arg}' not found.")
            elif action == "exit":
                print("Exiting Villages Project CLI.")
                break
            else:
                print("Unknown command. Try 'list', 'get <village_name>', or 'exit'.")
        except (KeyboardInterrupt, EOFError):
            print("\nExiting Villages Project CLI.")
            break

if __name__ == "__main__":
    main()
