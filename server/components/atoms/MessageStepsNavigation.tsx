export const StepsNavigation = ({ currentStep }: {currentStep: number}) => {
  const steps = ['Destinataires', 'Message']

  return (
    <div className="p-2 md:p-4 border-b">
      <div className="flex flex-col sm:flex-row justify-between">
        {steps.map((step, idx) => (
          <div
            key={step}
            className={`flex items-center mb-2 sm:mb-0 ${
              idx !== steps.length - 1 ? 'sm:mr-4' : ''
            } ${currentStep === idx + 1 ? 'text-blue-500' : 'text-gray-400'}`}
          >
            <div
              className={`
                w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm sm:text-base
                ${currentStep === idx + 1 ? 'bg-blue-100' : 'bg-gray-100'}
              `}
            >
              {idx + 1}
            </div>
            <span className="ml-2 text-sm sm:text-base">{step}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
