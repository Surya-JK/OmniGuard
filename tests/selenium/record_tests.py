import cv2
import numpy as np
import mss
import time
import sys
import os

OUTPUT_FILE = os.path.join(os.path.dirname(__file__), 'reports', 'OmniGuard_Test_Recording.avi')
FPS = 10.0

def main():
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    
    with mss.mss() as sct:
        monitor = sct.monitors[1]  # primary monitor
        width, height = monitor["width"], monitor["height"]
        
        fourcc = cv2.VideoWriter_fourcc(*'XVID')
        out = cv2.VideoWriter(OUTPUT_FILE, fourcc, FPS, (width, height))
        
        print(f"Recording started on {width}x{height} at {FPS} FPS...")
        print("Press Ctrl+C to stop recording.")
        
        try:
            while True:
                if os.path.exists('stop.txt'):
                    print("Stop signal detected. Stopping recording...")
                    os.remove('stop.txt')
                    break
                
                start_time = time.time()
                img = np.array(sct.grab(monitor))
                frame = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)
                out.write(frame)
                
                elapsed = time.time() - start_time
                time_to_sleep = max(0, (1.0 / FPS) - elapsed)
                time.sleep(time_to_sleep)
                
        except KeyboardInterrupt:
            print("\nStopping recording...")
        finally:
            out.release()
            cv2.destroyAllWindows()
            print(f"Video saved to: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
