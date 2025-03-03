import os
import sys


def merge_code(directories, output_file="merged_code.txt"):
    with open(output_file, "w", encoding="utf-8") as outfile:
        for directory in directories:
            # Walk through all subdirectories and files
            for root, dirs, files in os.walk(directory):
                for file in files:
                    file_path = os.path.join(root, file)
                    # Get the path relative to the base directory for a cleaner header
                    relative_path = os.path.relpath(file_path, directory)

                    # Write header with the file path
                    outfile.write(f"// {directory}/{relative_path}\n")

                    try:
                        with open(file_path, "r", encoding="utf-8") as infile:
                            # Write the file contents
                            outfile.write(infile.read())
                    except Exception as e:
                        outfile.write(f"// Error reading file: {e}\n")

                    # Separate file sections by an extra newline
                    outfile.write("\n\n")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python merge_code.py <output_file> <directory1> [directory2 ...]")
    else:
        output_file = sys.argv[1]
        directories = sys.argv[2:]
        merge_code(directories, output_file)
