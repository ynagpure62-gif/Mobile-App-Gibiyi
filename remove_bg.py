import os
import sys
from PIL import Image, ImageOps
from collections import deque

def remove_background(img_path, output_path=None, tolerance=30):
    if not os.path.exists(img_path):
        print(f"Error: File not found at {img_path}")
        return False
        
    print(f"Opening image: {img_path}")
    img = Image.open(img_path).convert("RGBA")
    width, height = img.size
    
    # Let's do a flood fill from the corners to make the background transparent.
    # This avoids making white parts INSIDE the logo transparent.
    pixels = img.load()
    
    # We'll use a queue for BFS flood fill
    queue = deque()
    visited = set()
    
    # Corners to start flood fill from
    corners = [
        (0, 0),
        (width - 1, 0),
        (0, height - 1),
        (width - 1, height - 1)
    ]
    
    # We'll auto-detect the background color from the top-left corner
    bg_color = pixels[0, 0]
    print(f"Detected background color (from top-left corner): {bg_color[:3]}")
    
    for corner in corners:
        queue.append(corner)
        visited.add(corner)
        
    def color_distance(c1, c2):
        # Euclidean distance between RGB values
        return ((c1[0] - c2[0]) ** 2 + (c1[1] - c2[1]) ** 2 + (c1[2] - c2[2]) ** 2) ** 0.5

    print("Running BFS flood fill to remove background...")
    while queue:
        x, y = queue.popleft()
        
        # Get current pixel color
        curr_color = pixels[x, y]
        
        # If it's close enough to the background color, make it transparent
        if color_distance(curr_color, bg_color) <= tolerance:
            # Set alpha to 0 (fully transparent)
            pixels[x, y] = (curr_color[0], curr_color[1], curr_color[2], 0)
            
            # Add neighbors to queue
            for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < width and 0 <= ny < height:
                    if (nx, ny) not in visited:
                        visited.add((nx, ny))
                        queue.append((nx, ny))

    # Determine output path
    if not output_path:
        base, ext = os.path.splitext(img_path)
        output_path = f"{base}_transparent.png"
        
    print(f"Saving transparent image to: {output_path}")
    img.save(output_path, "PNG")
    print("Background removal completed successfully!")
    return True

if __name__ == "__main__":
    # Default image path
    default_img = os.path.join("artifacts", "logo-store", "assets", "images", "logo.png")
    
    img_path = sys.argv[1] if len(sys.argv) > 1 else default_img
    
    # We will save it overwriting the original logo.png or saving as transparent
    # Let's save it to logo.png directly so the app updates instantly!
    output_path = img_path
    
    if not os.path.exists(img_path):
        # Fallback to logo.jpg if logo.png doesn't exist
        fallback_jpg = os.path.join("artifacts", "logo-store", "assets", "images", "logo.jpg")
        if os.path.exists(fallback_jpg):
            img_path = fallback_jpg
            output_path = os.path.join("artifacts", "logo-store", "assets", "images", "logo.png")

    remove_background(img_path, output_path=output_path, tolerance=40)
