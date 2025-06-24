'use client'

import { Fragment } from 'react'

interface GradeStepperProps {
  currentStep: number
}

export function GradeStepper({ currentStep }: GradeStepperProps) {
  const steps = [
    { label: 'Informations' },
    { label: 'Classe' },
    { label: 'Notes' },
  ]

  return (
    <>
      {/* En-tête */}
      <section className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-foreground
            bg-gradient-to-r from-primary to-primary-accent
            bg-clip-text">
            Créer une nouvelle évaluation
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
            Suivez les étapes pour créer une évaluation et saisir les notes de vos élèves.
        </p>
      </section>
      <section className="flex items-center justify-center space-x-4 mb-8">
        {steps.map((step, idx) => (
          <Fragment key={step.label}>
            <div className="flex items-center space-x-2">
              <div
                className={
                  [
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                    currentStep >= idx + 1
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground',
                  ].join(' ')
                }
              >
                {currentStep > idx + 1 ? '✓' : idx + 1}
              </div>
              <span
                className={`text-sm font-medium ${
                  currentStep >= idx + 1 ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && <div className="w-12 h-0.5 bg-muted"></div>}
          </Fragment>
        ))}
      </section>
    </>
  )
}
