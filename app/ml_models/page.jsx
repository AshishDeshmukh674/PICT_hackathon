'use client';
import { healthModels } from '../config/modelConfig';
import Link from 'next/link';

export default function MLModels() {
    return (
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold mb-6">Healthcare ML Models</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {healthModels.map((model) => (
                    <Link href={`/ml_models/${model.id}`} key={model.id}>
                        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer">
                            <div className="text-4xl mb-4">{model.icon}</div>
                            <h2 className="text-xl font-semibold mb-2">{model.name}</h2>
                            <p className="text-gray-600">{model.description}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}