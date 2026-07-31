import obsEyeMark from '../assets/obs-eye.svg';

interface HeroObsEyeProps {
  animationRun: number;
}

export function HeroObsEye({ animationRun }: HeroObsEyeProps) {
  const isRunning = animationRun > 0;

  return (
    <span
      className={`hero-obs-eye${isRunning ? ' hero-obs-eye--running' : ''}`}
      aria-hidden="true"
    >
      <span key={animationRun} className="hero-obs-eye__startup">
        <span className="hero-obs-eye__fan">
          <img
            src={obsEyeMark}
            alt=""
            draggable={false}
            className="hero-obs-eye__mark"
          />
        </span>
      </span>
    </span>
  );
}
