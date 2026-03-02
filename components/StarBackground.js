/** @format */

export default function StarBackground({ className = "" }) {
  return (
    <div className={`absolute hidden lg:block ${className}`}>
      <div className="size-[880px] absolute -top-[247px] -left-[640px] star-path -rotate-[8.5deg]"></div>
      {/* <div className="size-[880px] absolute top-[619px] left-[149px] star-path -rotate-[8.5deg]"></div> */}
    </div>
  );
}
