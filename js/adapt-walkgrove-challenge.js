define([
  'core/js/adapt',
  'core/js/views/componentView',
  'core/js/models/componentModel'
], function(Adapt, ComponentView, ComponentModel) {

  var ChallengeView = ComponentView.extend({

    events: {
      'click .js-challenge-start-click': 'onStartClicked',
      'click .js-challenge-first-click': 'onFirstClicked',
      'click .js-challenge-second-click': 'onSecondClicked'
    },

    _questionIndex: 0,
    _questionsTotal: 0,
    _corrects: 0,
    _incorrects: 0,
    _nextTimer: null,
    _nextTimeout: null,
    _timer: 0,
    _timeouts: [],
    
    preRender: function() {
      this.checkIfResetOnRevisit();
    },

    postRender: function() {
      this.setReadyStatus();

      this._questionsTotal = this.model.get('_items').length;
      this._questionIndex = this._questionsTotal - 1;

      this._timer = this.model.get('_timeout') * 1000;
      this._nextTimer = this.model.get('_timer') * 1000;

      let timeVars = new Array();
      this.model.get('_items').forEach((item, index) => {
        let timeVar = null;
        timeVars.push(timeVar);
      });

      this._timeouts = timeVars;

      this.$('.challenge__instruction-inner').a11y_focus();
    },

    checkIfResetOnRevisit: function() {
      // var isResetOnRevisit = this.model.get('_isResetOnRevisit');

      // If reset is enabled set defaults
      // if (isResetOnRevisit) {
        this.model.reset(true);
      // }
    },

    onStartClicked: function() {
      this.$('.challenge__main').addClass('is-visible');
      this.$('.challenge__button').removeClass('is-visible');

      this.$('.challenge__instruction-inner').html(this.model.get('ins2'));
      
      if (Adapt.device.screenSize !== 'small') {
        Adapt.scrollTo(this.$('.challenge__body-inner'), { duration: 400 });
        this.$('.challenge__body-inner').a11y_focus();
      }else{
        Adapt.scrollTo(this.$('.challenge__instruction'), { duration: 400 });
        this.$('.challenge__instruction-inner').a11y_focus();
      }

      //setTimeout(this.showNextQuestion(), this._nextTimer);
      setTimeout(() => {this.nextAction()}, 1000);
    },

    onFirstClicked: function (event) {
      this.answerClicked(1, this.onGetQuestionNumber(event));
    },

    onSecondClicked: function(event) {
      this.answerClicked(2, this.onGetQuestionNumber(event));
    },

    onGetQuestionNumber: function(event) {
      var $target = $(event.currentTarget);
      $target.addClass('is-answered'); //option selected
      $target.siblings().addClass('is-answered');
      return $target.attr('data-qnum');
    },

    answerClicked: function(optionIndex, qNum) {

      let answer = 0;

      clearTimeout(this._timeouts[qNum]);
      this._timeouts[qNum] = null;

      qNum = Number(qNum);
      
      this.model.get('_items').forEach(function(item, index) {
        if(index === qNum) {
          answer = item._answer;
        }
      });
      
      if(answer === optionIndex) {
        this._corrects++;
        this.$('.challenge__item-feedback').eq(qNum).addClass('is-correct');
      } else {
        this._incorrects++;
        this.$('.challenge__item-feedback').eq(qNum).addClass('is-incorrect');
      }

      this.$('.challenge__item-content').eq(qNum).addClass('is-hidden');

      clearTimeout(this._nextTimeout);
      this.checkEnd();
      this.nextAction();

    },

    timedOut: function() {

      let findFirstTimeout = -1;
      this._timeouts.forEach((timeout, index) => {
        if(timeout !== null) {
          findFirstTimeout = index;
        }
      });

      this._timeouts[findFirstTimeout] = null;

      this.$('.challenge__item').eq(findFirstTimeout).find('.challenge__item-buttons').addClass('is-answered');

      this.$('.challenge__item-content').eq(findFirstTimeout).addClass('is-hidden');

      this._incorrects++;
      this.$('.challenge__item-feedback').eq(findFirstTimeout).addClass('is-incorrect');
      this.$('.challenge__item').eq(findFirstTimeout).addClass('is-timedout');

      this.checkEnd();

    },

    nextAction: function() {
      if(this._questionIndex >= 0) {
        this.showNextQuestion();
      }
    },

    showNextQuestion: function() {
      if(this._nextTimeout !== null) {
        clearTimeout(this._nextTimeout);
      }
      this.$('.challenge__item').eq(this._questionIndex).addClass('is-active');
      this._timeouts[this._questionIndex] = setTimeout(() => {this.timedOut()}, this._timer);
      this._questionIndex--;

      this.$('.challenge__item').eq(this._questionIndex).a11y_focus();

      this._nextTimeout = setTimeout(() => {this.nextAction()}, this._nextTimer);
    },

    checkEnd: function() {
      const answered = this._incorrects + this._corrects;
      if (answered === this._questionsTotal) {
        this.onEndQuiz();
      }
    },

    onEndQuiz: function () {
      //show all feedbacks (even if timed out)
      this.model.get('_items').forEach(function(item, index) {
        this.$('.challenge__item').eq(index).addClass('is-visible');
      });
      //show relevant feedback
      let fbackNum = -1;
      this.model.get('_feedbacks').forEach((fback, index) => {
        if (this._corrects >= fback._score) {
          fbackNum = index;
        }
      });
      this.$('.challenge__feedback').eq(fbackNum).addClass('is-answered');

      this.$('.challenge__feedback').eq(fbackNum).a11y_focus();
      
      this.setCompletionStatus();
      this.$('.challenge__instruction-inner').html(this.model.get('ins3'));

      Adapt.scrollTo(this.$('.challenge__feedbacks'), { duration: 400 });
      
    }

  },
  {
    template: 'challenge'
  });

  return Adapt.register('challenge', {
    model: ComponentModel.extend({}),// create a new class in the inheritance chain so it can be extended per component type if necessary later
    view: ChallengeView
  });
});
