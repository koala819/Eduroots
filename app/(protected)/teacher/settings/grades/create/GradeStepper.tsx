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
    <div className="space-y-8">
      {/* En-tête simple et élégant */}
      <section className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-foreground">
          Créer une nouvelle évaluation
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Suivez les étapes pour créer une évaluation et saisir les notes de vos élèves.
        </p>
      </section>

      {/* Stepper épuré */}
      <section className="flex items-center justify-center">
        <div className="flex items-center space-x-8">
          {steps.map((step, idx) => (
            <Fragment key={step.label}>
              <div className="flex flex-col items-center space-y-3">
                {/* Cercle simple */}
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                    transition-colors duration-200
                    ${currentStep >= idx + 1
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
            }
                  `}
                >
                  {currentStep > idx + 1 ? '✓' : idx + 1}
                </div>

                {/* Label */}
                <span
                  className={`
                    text-sm font-medium transition-colors duration-200
                    ${currentStep >= idx + 1 ? 'text-foreground' : 'text-muted-foreground'}
                  `}
                >
                  {step.label}
                </span>
              </div>

              {/* Ligne de séparation */}
              {idx < steps.length - 1 && (
                <div className="w-12 h-px bg-muted"></div>
              )}
            </Fragment>
          ))}
        </div>
      </section>
    </div>
  )
}
