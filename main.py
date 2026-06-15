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
    print("Available commands: list, get <village_name>")

    while True:
        command = input("> ").strip().split(maxsplit=1)
        action = command[0]

        if action == "list":
            villages = list_villages()
            print("Villages:")
            for village in villages:
                print(f"- {village}")
        elif action == "get" and len(command) > 1:
            village_name = command[1]
            data = get_village_data(village_name)
            if data["population"] > 0:
                print(f"Data for {village_name}:")
                print(f"  Population: {data['population']}")
                print(f"  Resources: {', '.join(data['resources'])}")
            else:
                print(f"Village '{village_name}' not found.")
        elif action == "exit":
            print("Exiting Villages Project CLI.")
            break
        else:
            print("Unknown command or invalid arguments. Try 'list' or 'get <village_name>'.")

if __name__ == "__main__":
    main()
