import React from "react";

export const LoadingSpinner: React.FC = () => {
  return (
    <>
      <div className="loading-container" role="status" aria-label="Carregando">
        <div className="title-text">DATAFY</div>
        <div className="mask-container">
          <div className="squares-container">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`square ${i === 0 ? 'sliding-square' : 'orbiting-square'}`}
                style={{
                  left: `${32.5 + i * (25 + 32.5)}px`, // Even distribution for 5 squares in 320px
                  animationDelay: i === 0 ? '0s' : `${(4 - i) * 0.05}s` // Inverse delay for orbiting squares
                }}
              >
                <div className="shine-overlay" />
              </div>
            ))}

            <div className="global-light-ray" />
          </div>
          <div className="masked-text">CARREGANDO</div>
        </div>
      </div>

      <style jsx>{`
        .loading-container {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100%;
          height: 100vh;
          background: radial-gradient(circle at center, #111 0%, #000 100%);
          font-weight: 700;
          font-family: "Arial Black", Arial, sans-serif;
          letter-spacing: 6px;
          user-select: none;
          overflow: hidden;
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .title-text {
          font-size: 28px;
          margin-bottom: 12px;
        }

        .mask-container {
          position: relative;
          width: 360px;
          height: 80px;
        }

        .masked-text {
          font-size: 32px;
          font-weight: bold;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: linear-gradient(90deg, #00f0ff, #00ff88, #ff00cc);
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
          filter: drop-shadow(0 0 5px rgba(255,255,255,0.7));
          z-index: 1;
        }

        .squares-container {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 320px; /* Adjusted to fit 5 squares with even spacing */
          height: 25px; /* Adjusted for square size */
          z-index: 2;
        }

        .square {
          width: 25px;
          height: 25px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid white;
          box-shadow: 0 0 6px rgba(0, 255, 255, 0.7);
          backdrop-filter: blur(3px);
          -webkit-backdrop-filter: blur(3px);
          position: absolute;
          overflow: hidden;
          mix-blend-mode: screen;
        }

        .shine-overlay {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%);
          animation: shine-pass 4s ease-in-out infinite;
        }

        @keyframes shine-pass {
          0% {
            left: -100%;
          }
          25% {
            left: 100%;
          }
          50%, 100% {
            left: 100%;
          }
        }

        .sliding-square {
          top: 0;
          left: 0;
          border-color: #00f0ff;
          animation: slide-horizontal 4s ease-in-out infinite;
          z-index: 3;
        }

        @keyframes slide-horizontal {
          0% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(295px); /* 320px width - 25px square */
          }
          50% {
            transform: translateX(295px);
          }
          75% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(0);
          }
        }

        .orbiting-square {
          animation: orbit-left 4s ease-in-out infinite; /* Match slide duration */
        }

        @keyframes orbit-left {
          0%   { transform: rotate(0deg);   } /* Sliding square starts moving right */
          25%  { transform: rotate(180deg);  } /* Sliding square reaches right end, 1st rotation complete */
          50%  { transform: rotate(180deg);  } /* Sliding square starts moving left */
          75%  { transform: rotate(360deg);  } /* Sliding square reaches left end, 2nd rotation complete */
          100% { transform: rotate(360deg); } /* Sliding square pauses at left end */
        }

        .global-light-ray {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.3), transparent);
          animation: global-ray 4s ease-in-out infinite;
          z-index: 0;
        }

        @keyframes global-ray {
          0% {
            left: -100%;
          }
          25% {
            left: 100%;
          }
          50%, 100% {
            left: 100%;
          }
        }
      `}</style>
    </>
  );
};
