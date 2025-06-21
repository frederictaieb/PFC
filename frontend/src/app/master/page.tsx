import Link from 'next/link';
export default function Master() {

    return (
    <div className="flex flex-col items-center justify-center h-screen space-y-8">
        <div className="text-8xl font-bold text-gray-800 pb-30">
            <Link href={`${process.env.NEXT_PUBLIC_FASTAPI_URL}/master/start`} className="text-blue-700">
                <div className="underline text-center">Start</div></Link>
        </div>
    </div>

    );
}